import {
  DEFAULT_GAME_SETTINGS,
  Direction,
  FallingObject,
  GameSettings,
  GAME_DIMENSIONS,
} from "../models/game.models";
import { getInitialPlayerX } from "../logic/player.logic";

export interface GameState {
  settings: GameSettings;
  playerX: number;
  objects: FallingObject[];
  score: number;
  timeRemaining: number;
  running: boolean;
  direction: Direction;
  nextObjectId: number;
}

export const DEFAULT_DIRECTION: Direction = 0;

export const initialGameState: GameState = {
  settings: DEFAULT_GAME_SETTINGS,
  playerX: getInitialPlayerX(GAME_DIMENSIONS),
  objects: [],
  score: 0,
  timeRemaining: DEFAULT_GAME_SETTINGS.gameTime,
  running: false,
  direction: DEFAULT_DIRECTION,
  nextObjectId: 0,
};
