import { GameState } from "../game.state";
import { clampTimeRemaining, resetState } from "./game.reducer.utils";

export const onStartGame = (
  state: GameState,
  { settings }: { settings: GameState["settings"] }
): GameState => resetState(state, settings);

export const onStopGame = (state: GameState): GameState => ({
  ...state,
  running: false,
  direction: 0,
  objects: [],
});

export const onTickTimer = (state: GameState): GameState => {
  if (!state.running) {
    return state;
  }

  if (state.timeRemaining <= 0) {
    return {
      ...state,
      running: false,
      direction: 0,
      objects: [],
    };
  }

  return {
    ...state,
    timeRemaining: clampTimeRemaining(state.timeRemaining - 1),
  };
};
