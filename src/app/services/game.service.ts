import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, Subject, Subscription, combineLatest, filter, interval, map, switchMap, takeUntil, tap } from 'rxjs';
import { FallingObject, GameSettings, GameSnapshot } from '../models/game.models';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 320;
const PLAYER_WIDTH = 60;
const OBJECT_RADIUS = 12;
const TICK_MS = 16;

type Dimensions = { width: number; height: number; playerWidth: number; objectRadius: number };

type Direction = -1 | 0 | 1;

const isSettings = (settings: GameSettings | null): settings is GameSettings => settings !== null;

@Injectable({ providedIn: 'root' })
export class GameService implements OnDestroy {
  private readonly settings$ = new BehaviorSubject<GameSettings | null>(null);
  private readonly playerX$ = new BehaviorSubject<number>(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  private readonly objects$ = new BehaviorSubject<FallingObject[]>([]);
  private readonly score$ = new BehaviorSubject<number>(0);
  private readonly timeRemaining$ = new BehaviorSubject<number>(0);
  private readonly running$ = new BehaviorSubject<boolean>(false);
  private readonly direction$ = new BehaviorSubject<Direction>(0);
  private readonly destroy$ = new Subject<void>();
  private readonly subscriptions = new Subscription();

  private readonly activeSettings$ = this.settings$.pipe(filter(isSettings));
  private readonly runningSettings$ = combineLatest([this.running$, this.activeSettings$]);

  readonly snapshot$: Observable<GameSnapshot> = combineLatest([
    this.objects$,
    this.playerX$,
    this.score$,
    this.timeRemaining$,
    this.running$
  ]).pipe(
    map(([objects, playerX, score, timeRemaining, running]) => ({
      objects,
      playerX,
      score,
      timeRemaining,
      running
    }))
  );

  constructor() {
    this.subscriptions.add(
      this.runningSettings$
        .pipe(
          switchMap(([running, settings]) =>
            running ? interval(TICK_MS).pipe(tap(() => this.advanceFrame(settings))) : EMPTY
          ),
          takeUntil(this.destroy$)
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.runningSettings$
        .pipe(
          switchMap(([running, settings]) =>
            running ? interval(settings.fallingFrequency).pipe(tap(() => this.spawnObject())) : EMPTY
          ),
          takeUntil(this.destroy$)
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.runningSettings$
        .pipe(
          switchMap(([running, settings]) =>
            running ? interval(1000).pipe(tap((elapsed) => this.updateTimer(settings, elapsed + 1))) : EMPTY
          ),
          takeUntil(this.destroy$)
        )
        .subscribe()
    );
  }

  get dimensions(): Dimensions {
    return { width: GAME_WIDTH, height: GAME_HEIGHT, playerWidth: PLAYER_WIDTH, objectRadius: OBJECT_RADIUS };
  }

  updateSettings(partial: Partial<GameSettings>): void {
    const current = this.settings$.value;
    if (!current) {
      return;
    }
    const nextSettings: GameSettings = { ...current, ...partial };
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
  }

  updateDirection(direction: Direction): void {
    if (!this.running$.value) {
      return;
    }
    this.direction$.next(direction);
  }

  private resetState(settings: GameSettings): void {
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
      const overlapX = object.x >= playerX - OBJECT_RADIUS && object.x <= playerX + PLAYER_WIDTH + OBJECT_RADIUS;
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
    const newObject: FallingObject = { id: Date.now() + Math.floor(Math.random() * 1000), x, y: 0, caught: false };
    this.objects$.next([...this.objects$.value, newObject]);
  }

  private updateTimer(settings: GameSettings, elapsedSeconds: number): void {
    const remaining = Math.max(settings.gameTime - elapsedSeconds, 0);
    this.timeRemaining$.next(remaining);
    if (remaining <= 0) {
      this.stopGame();
    }
  }

  ngOnDestroy(): void {
    this.stopGame();
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
    this.settings$.complete();
    this.playerX$.complete();
    this.objects$.complete();
    this.score$.complete();
    this.timeRemaining$.complete();
    this.running$.complete();
    this.direction$.complete();
  }
}
