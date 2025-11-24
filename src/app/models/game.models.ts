export interface GameSettings {
  fallingSpeed: number;
  fallingFrequency: number;
  playerSpeed: number;
  gameTime: number;
}

export interface FallingObject {
  id: number;
  x: number;
  y: number;
  caught: boolean;
}

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
