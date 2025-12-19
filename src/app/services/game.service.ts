import { DestroyRef, Injectable, OnDestroy } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Store } from "@ngrx/store";
import {
  EMPTY,
  Observable,
  combineLatest,
  interval,
  shareReplay,
  switchMap,
  tap,
} from "rxjs";
import {
  GAME_DIMENSIONS,
  Direction,
  GameDimensions,
  GameSettings,
  GameSnapshot,
} from "../models/game.models";
import { gameActions } from "../store/game.actions";
import {
  selectGameSnapshot,
  selectRunning,
  selectSettings,
} from "../store/game.selectors";

const TICK_MS = 16;

@Injectable({ providedIn: "root" })
export class GameService implements OnDestroy {
  private tickingInitialized = false;

  readonly dimensions: GameDimensions = GAME_DIMENSIONS;
  readonly snapshot$: Observable<GameSnapshot> = this.store.select(
    selectGameSnapshot
  );

  private readonly runningSettings$ = combineLatest([
    this.store.select(selectRunning),
    this.store.select(selectSettings),
  ]).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  constructor(
    private readonly store: Store,
    private readonly destroyRef: DestroyRef
  ) {}

  updateSettings(partial: Partial<GameSettings>): void {
    this.store.dispatch(gameActions.updateSettings({ settings: partial }));
  }

  startGame(settings: GameSettings): void {
    this.startTicking();
    this.store.dispatch(gameActions.startGame({ settings }));
  }

  stopGame(): void {
    this.store.dispatch(gameActions.stopGame());
  }

  updateDirection(direction: Direction): void {
    this.store.dispatch(gameActions.updateDirection({ direction }));
  }

  private startTicking(): void {
    if (this.tickingInitialized) {
      return;
    }
    this.tickingInitialized = true;

    this.runningSettings$
      .pipe(
        switchMap(([running]) =>
          running
            ? interval(TICK_MS).pipe(
                tap(() =>
                  this.store.dispatch(gameActions.advanceFrame())
                )
              )
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
                tap(() => this.store.dispatch(gameActions.spawnObject()))
              )
            : EMPTY
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.runningSettings$
      .pipe(
        switchMap(([running]) =>
          running
            ? interval(1000).pipe(
                tap(() => this.store.dispatch(gameActions.tickTimer()))
              )
            : EMPTY
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.stopGame();
  }
}
