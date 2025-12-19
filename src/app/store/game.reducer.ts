import { createReducer, on } from "@ngrx/store";
import { gameActions } from "./game.actions";
import { GameState, initialGameState } from "./game.state";
import { onUpdateSettings } from "./reducer/game-settings.reducer";
import { onAdvanceFrame, onSpawnObject } from "./reducer/game-runtime.reducer";
import { onStartGame, onStopGame, onTickTimer } from "./reducer/game-timer.reducer";

export const gameReducer = createReducer<GameState>(
  initialGameState,
  on(gameActions.updateSettings, onUpdateSettings),
  on(gameActions.startGame, onStartGame),
  on(gameActions.stopGame, onStopGame),
  on(gameActions.updateDirection, (state, { direction }) => {
    if (!state.running || state.direction === direction) {
      return state;
    }
    return { ...state, direction };
  }),
  on(gameActions.advanceFrame, onAdvanceFrame),
  on(gameActions.spawnObject, onSpawnObject),
  on(gameActions.tickTimer, onTickTimer)
);
