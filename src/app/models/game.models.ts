export interface GameSettings {
  fallingSpeed: number;
  fallingFrequency: number;
  playerSpeed: number;
  gameTime: number;
}

export const GAME_DIMENSIONS = {
  width: 480,
  height: 320,
  playerWidth: 60,
  playerHeight: 16,
  playerOffset: 8,
  objectRadius: 12
} as const;

export type GameDimensions = typeof GAME_DIMENSIONS;

export const settingsEqual = (a: GameSettings, b: GameSettings): boolean =>
  a.fallingSpeed === b.fallingSpeed &&
  a.fallingFrequency === b.fallingFrequency &&
  a.playerSpeed === b.playerSpeed &&
  a.gameTime === b.gameTime;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  fallingSpeed: 2,
  fallingFrequency: 800,
  playerSpeed: 8,
  gameTime: 30
};

export interface FallingObject {
  id: number;
  x: number;
  y: number;
  caught: boolean;
}

export type Direction = -1 | 0 | 1;

export interface GameSnapshot {
  objects: FallingObject[];
  playerX: number;
  score: number;
  timeRemaining: number;
  running: boolean;
}

export interface SocketPayload {
  caughtObjects: number;
  timeRemaining: number;
}
