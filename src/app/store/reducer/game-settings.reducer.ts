import { GameState } from "../game.state";
import { clampTimeRemaining } from "./game.reducer.utils";

export const onUpdateSettings = (
  state: GameState,
  { settings }: { settings: Partial<GameState["settings"]> }
): GameState => {
  const nextSettings = { ...state.settings, ...settings };
  const timeRemaining =
    settings.gameTime !== undefined
      ? clampTimeRemaining(settings.gameTime)
      : state.timeRemaining;

  return {
    ...state,
    settings: nextSettings,
    timeRemaining,
  };
};
