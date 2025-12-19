import { createFeatureSelector, createSelector } from "@ngrx/store";
import { GameSnapshot } from "../models/game.models";
import { GameState } from "./game.state";

export const selectGameState = createFeatureSelector<GameState>("game");

export const selectRunning = createSelector(
  selectGameState,
  (state) => state.running
);

export const selectSettings = createSelector(
  selectGameState,
  (state) => state.settings
);

export const selectGameSnapshot = createSelector(
  selectGameState,
  (state): GameSnapshot => ({
    objects: state.objects,
    playerX: state.playerX,
    score: state.score,
    timeRemaining: state.timeRemaining,
    running: state.running,
  })
);
