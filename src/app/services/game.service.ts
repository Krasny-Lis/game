import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, interval, map, takeWhile, tap } from 'rxjs';
import { FallingObject, GameSettings, GameSnapshot } from '../models/game.models';

const GAME_WIDTH = 480;
const GAME_HEIGHT = 320;
const PLAYER_WIDTH = 60;
const OBJECT_RADIUS = 12;

@Injectable({ providedIn: 'root' })
export class GameService implements OnDestroy {
  private settings$ = new BehaviorSubject<GameSettings | null>(null);
  private playerX$ = new BehaviorSubject<number>(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
  private objects$ = new BehaviorSubject<FallingObject[]>([]);
  private score$ = new BehaviorSubject<number>(0);
  private timeRemaining$ = new BehaviorSubject<number>(0);
  private running$ = new BehaviorSubject<boolean>(false);

  private spawnSub?: Subscription;
  private tickSub?: Subscription;
  private timerSub?: Subscription;

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

  get dimensions(): { width: number; height: number; playerWidth: number; objectRadius: number } {
    return { width: GAME_WIDTH, height: GAME_HEIGHT, playerWidth: PLAYER_WIDTH, objectRadius: OBJECT_RADIUS };
  }

  updateSettings(partial: Partial<GameSettings>): void {
    const nextSettings = { ...this.settings$.value, ...partial } as GameSettings;
    this.settings$.next(nextSettings);

    if (this.running$.value && nextSettings) {
      this.startTicking();
      this.startSpawning();
    }
  }

  startGame(settings: GameSettings): void {
    this.settings$.next(settings);
    this.resetState(settings.gameTime);
    this.running$.next(true);
    this.startTicking();
    this.startSpawning();
    this.startTimer();
  }

  stopGame(): void {
    this.running$.next(false);
    this.clearSubscriptions();
  }

  movePlayer(direction: -1 | 0 | 1): void {
    const settings = this.settings$.value;
    if (!settings || !this.running$.value) {
      return;
    }
    const nextX = this.playerX$.value + direction * settings.playerSpeed;
    const clamped = Math.max(0, Math.min(GAME_WIDTH - PLAYER_WIDTH, nextX));
    this.playerX$.next(clamped);
  }

  private startTicking(): void {
    this.tickSub?.unsubscribe();
    this.tickSub = interval(16)
      .pipe(takeWhile(() => this.running$.value))
      .subscribe(() => this.tick());
  }

  private startSpawning(): void {
    const settings = this.settings$.value;
    if (!settings) {
      return;
    }
    this.spawnSub?.unsubscribe();
    this.spawnSub = interval(settings.fallingFrequency)
      .pipe(takeWhile(() => this.running$.value))
      .subscribe(() => this.spawnObject());
  }

  private startTimer(): void {
    const settings = this.settings$.value;
    if (!settings) {
      return;
    }
    this.timerSub?.unsubscribe();
    this.timerSub = interval(1000)
      .pipe(
        takeWhile(() => this.running$.value),
        tap((elapsed) => this.timeRemaining$.next(settings.gameTime - (elapsed + 1)))
      )
      .subscribe(() => {
        if (this.timeRemaining$.value <= 0) {
          this.stopGame();
        }
      });
  }

  private resetState(gameTime: number): void {
    this.objects$.next([]);
    this.score$.next(0);
    this.timeRemaining$.next(gameTime);
    this.playerX$.next(GAME_WIDTH / 2 - PLAYER_WIDTH / 2);
    this.clearSubscriptions();
  }

  private tick(): void {
    const settings = this.settings$.value;
    if (!settings) {
      return;
    }
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

  private spawnObject(): void {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const x = Math.random() * (GAME_WIDTH - OBJECT_RADIUS * 2) + OBJECT_RADIUS;
    const newObject: FallingObject = { id, x, y: 0, caught: false };
    this.objects$.next([...this.objects$.value, newObject]);
  }

  private clearSubscriptions(): void {
    this.spawnSub?.unsubscribe();
    this.tickSub?.unsubscribe();
    this.timerSub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.clearSubscriptions();
  }
}
