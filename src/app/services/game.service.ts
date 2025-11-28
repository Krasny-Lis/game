import { DestroyRef, Injectable, OnDestroy } from "@angular/core";
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  combineLatest,
  interval,
  map,
  shareReplay,
  switchMap,
  tap,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  DEFAULT_GAME_SETTINGS,
  GAME_DIMENSIONS,
  FallingObject,
  GameDimensions,
  GameSettings,
  GameSnapshot,
  settingsEqual,
} from "../models/game.models";

const TICK_MS = 16;

type Direction = -1 | 0 | 1;

@Injectable({ providedIn: "root" })
export class GameService implements OnDestroy {
  private nextObjectId = 0;
  private readonly settings$ = new BehaviorSubject<GameSettings>(
    DEFAULT_GAME_SETTINGS
  );
  private readonly playerX$ = new BehaviorSubject<number>(
    GAME_DIMENSIONS.width / 2 - GAME_DIMENSIONS.playerWidth / 2
  );
  private readonly objects$ = new BehaviorSubject<FallingObject[]>([]);
  private readonly score$ = new BehaviorSubject<number>(0);
  private readonly timeRemaining$ = new BehaviorSubject<number>(0);
  private readonly running$ = new BehaviorSubject<boolean>(false);
  private readonly direction$ = new BehaviorSubject<Direction>(0);

  private readonly runningSettings$ = combineLatest([
    this.running$,
    this.settings$,
  ]).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  readonly dimensions: GameDimensions = GAME_DIMENSIONS;

  readonly snapshot$: Observable<GameSnapshot> = combineLatest([
    this.objects$,
    this.playerX$,
    this.score$,
    this.timeRemaining$,
    this.running$,
  ]).pipe(
    map(([objects, playerX, score, timeRemaining, running]) => ({
      objects,
      playerX,
      score,
      timeRemaining,
      running,
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private tickingInitialized = false;

  constructor(private readonly destroyRef: DestroyRef) {}

  updateSettings(partial: Partial<GameSettings>): void {
    const current = this.settings$.value;
    const nextSettings: GameSettings = { ...current, ...partial };
    if (settingsEqual(current, nextSettings)) {
      return;
    }
    this.settings$.next(nextSettings);

    if (partial.gameTime !== undefined) {
      this.timeRemaining$.next(Math.max(partial.gameTime, 0));
    }
  }

  startGame(settings: GameSettings): void {
    this.startTicking();
    this.settings$.next({ ...settings });
    this.resetState(settings);
    this.running$.next(true);
    this.direction$.next(0);
  }

  stopGame(): void {
    this.running$.next(false);
    this.direction$.next(0);
    this.objects$.next([]);
    this.timeRemaining$.next(0);
  }

  updateDirection(direction: Direction): void {
    if (!this.running$.value || this.direction$.value === direction) {
      return;
    }
    this.direction$.next(direction);
  }

  private resetState(settings: GameSettings): void {
    this.nextObjectId = 0;
    this.objects$.next([]);
    this.score$.next(0);
    this.timeRemaining$.next(settings.gameTime);
    this.playerX$.next(
      GAME_DIMENSIONS.width / 2 - GAME_DIMENSIONS.playerWidth / 2
    );
  }

  private advanceFrame(settings: GameSettings): void {
    this.movePlayer(settings);
    const updated = this.objects$.value
      .map((object) => ({ ...object, y: object.y + settings.fallingSpeed }))
      .filter(
        (object) => object.y - GAME_DIMENSIONS.objectRadius < GAME_DIMENSIONS.height
      );

    const playerX = this.playerX$.value;
    let score = this.score$.value;

    const remainingObjects = updated.map((object) => {
      const reachedPlayer =
        object.y + GAME_DIMENSIONS.objectRadius >=
        GAME_DIMENSIONS.height -
          (GAME_DIMENSIONS.playerHeight + GAME_DIMENSIONS.playerOffset);
      const overlapX =
        object.x >= playerX - GAME_DIMENSIONS.objectRadius &&
        object.x <=
          playerX + GAME_DIMENSIONS.playerWidth + GAME_DIMENSIONS.objectRadius;
      if (reachedPlayer && overlapX) {
        score += 1;
        return { ...object, caught: true };
      }
      return object;
    });

    this.score$.next(score);
    this.objects$.next(remainingObjects.filter((object) => !object.caught));
  }

  private movePlayer(settings: GameSettings): void {
    const direction = this.direction$.value;
    if (direction === 0) {
      return;
    }
    const nextX = this.playerX$.value + direction * settings.playerSpeed;
    const clamped = Math.max(
      0,
      Math.min(GAME_DIMENSIONS.width - GAME_DIMENSIONS.playerWidth, nextX)
    );
    this.playerX$.next(clamped);
  }

  private spawnObject(): void {
    const x =
      Math.random() *
        (GAME_DIMENSIONS.width - GAME_DIMENSIONS.objectRadius * 2) +
      GAME_DIMENSIONS.objectRadius;
    const newObject: FallingObject = {
      id: ++this.nextObjectId,
      x,
      y: 0,
      caught: false,
    };
    this.objects$.next([...this.objects$.value, newObject]);
  }

  private updateTimer(): void {
    const remaining = this.timeRemaining$.value;
    if (remaining <= 0) {
      this.stopGame();
      return;
    }

    this.timeRemaining$.next(remaining - 1);
  }

  private startTicking(): void {
    if (this.tickingInitialized) {
      return;
    }
    this.tickingInitialized = true;

    this.runningSettings$
      .pipe(
        switchMap(([running, settings]) =>
          running
            ? interval(TICK_MS).pipe(tap(() => this.advanceFrame(settings)))
            : EMPTY
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.runningSettings$
      .pipe(
        switchMap(([running, settings]) =>
          running
            ? interval(settings.fallingFrequency).pipe(
                tap(() => this.spawnObject())
              )
            : EMPTY
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.runningSettings$
      .pipe(
        switchMap(([running]) =>
          running ? interval(1000).pipe(tap(() => this.updateTimer())) : EMPTY
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.stopGame();
    this.settings$.complete();
    this.playerX$.complete();
    this.objects$.complete();
    this.score$.complete();
    this.timeRemaining$.complete();
    this.running$.complete();
    this.direction$.complete();
  }
}
