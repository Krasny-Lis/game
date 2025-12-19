import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import {
  GAME_DIMENSIONS,
  Direction,
  GameDimensions,
  GameSettings,
  GameSnapshot,
} from "../models/game.models";
import { gameActions } from "../store/game.actions";
import { selectGameSnapshot } from "../store/game.selectors";

@Injectable({ providedIn: "root" })
export class GameService {
  readonly dimensions: GameDimensions = GAME_DIMENSIONS;
  readonly snapshot$: Observable<GameSnapshot> = this.store.select(
    selectGameSnapshot
  );

  constructor(private readonly store: Store) {}

  updateSettings(partial: Partial<GameSettings>): void {
    this.store.dispatch(gameActions.updateSettings({ settings: partial }));
  }

  startGame(settings: GameSettings): void {
    this.store.dispatch(gameActions.startGame({ settings }));
  }

  stopGame(): void {
    this.store.dispatch(gameActions.stopGame());
  }

  updateDirection(direction: Direction): void {
    this.store.dispatch(gameActions.updateDirection({ direction }));
  }
}
