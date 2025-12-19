import { Injectable } from "@angular/core";
import { createEffect } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import {
  EMPTY,
  combineLatest,
  distinctUntilChanged,
  interval,
  map,
  switchMap,
} from "rxjs";
import { gameActions } from "../game.actions";
import { selectRunning, selectSettings } from "../game.selectors";

const TICK_MS = 16;

@Injectable()
export class GameEffects {
  private readonly running$ = this.store
    .select(selectRunning)
    .pipe(distinctUntilChanged());
  private readonly settings$ = this.store.select(selectSettings);

  readonly advanceFrame$ = createEffect(() =>
    this.running$.pipe(
      switchMap((running) =>
        running ? interval(TICK_MS).pipe(map(() => gameActions.advanceFrame())) : EMPTY
      )
    )
  );

  readonly spawnObject$ = createEffect(() =>
    combineLatest([this.running$, this.settings$]).pipe(
      switchMap(([running, settings]) =>
        running
          ? interval(settings.fallingFrequency).pipe(
              map(() => gameActions.spawnObject())
            )
          : EMPTY
      )
    )
  );

  readonly tickTimer$ = createEffect(() =>
    this.running$.pipe(
      switchMap((running) =>
        running ? interval(1000).pipe(map(() => gameActions.tickTimer())) : EMPTY
      )
    )
  );

  constructor(private readonly store: Store) {}
}
