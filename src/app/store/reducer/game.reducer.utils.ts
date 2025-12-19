import { GAME_DIMENSIONS } from "../../models/game.models";
import { getInitialPlayerX } from "../../logic/player.logic";
import { GameState } from "../game.state";

export const clampTimeRemaining = (value: number): number => Math.max(value, 0);

export const resetState = (
  state: GameState,
  settings: GameState["settings"]
): GameState => ({
  ...state,
  settings: { ...settings },
  playerX: getInitialPlayerX(GAME_DIMENSIONS),
  objects: [],
  score: 0,
  timeRemaining: settings.gameTime,
  direction: 0,
  running: true,
  nextObjectId: 0,
});
