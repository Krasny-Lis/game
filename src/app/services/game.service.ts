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
  FallingObject,
  GameSettings,
  GameSnapshot,
  settingsEqual,
} from "../models/game.models";

const GAME_WIDTH = 480;
const GAME_HEIGHT = 320;
const PLAYER_WIDTH = 60;
const OBJECT_RADIUS = 12;
const TICK_MS = 16;

type Dimensions = {
  width: number;
  height: number;
  playerWidth: number;
  objectRadius: number;
};

type Direction = -1 | 0 | 1;

@Injectable({ providedIn: "root" })
export class GameService implements OnDestroy {
  private nextObjectId = 0;
  private readonly settings$ = new BehaviorSubject<GameSettings>(
    DEFAULT_GAME_SETTINGS
  );
  private readonly playerX$ = new BehaviorSubject<number>(
    GAME_WIDTH / 2 - PLAYER_WIDTH / 2
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

  readonly dimensions: Dimensions = {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    playerWidth: PLAYER_WIDTH,
    objectRadius: OBJECT_RADIUS,
  };

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

  constructor(private readonly destroyRef: DestroyRef) {
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
    this.playerX$.next(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  }

  private advanceFrame(settings: GameSettings): void {
    this.movePlayer(settings);
    const updated = this.objects$.value
      .map((object) => ({ ...object, y: object.y + settings.fallingSpeed }))
      .filter((object) => object.y - OBJECT_RADIUS < GAME_HEIGHT);

    const playerX = this.playerX$.value;
    let score = this.score$.value;

    const remainingObjects = updated.map((object) => {
      const reachedPlayer = object.y + OBJECT_RADIUS >= GAME_HEIGHT - 24;
      const overlapX =
        object.x >= playerX - OBJECT_RADIUS &&
        object.x <= playerX + PLAYER_WIDTH + OBJECT_RADIUS;
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
    const clamped = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, nextX));
    this.playerX$.next(clamped);
  }

  private spawnObject(): void {
    const x = Math.random() * (GAME_WIDTH - OBJECT_RADIUS * 2) + OBJECT_RADIUS;
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
