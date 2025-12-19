import { Direction, GameDimensions, GameSettings } from "../models/game.models";

export const getInitialPlayerX = (dimensions: GameDimensions): number =>
  dimensions.width / 2 - dimensions.playerWidth / 2;

export const movePlayer = (
  currentX: number,
  direction: Direction,
  settings: GameSettings,
  dimensions: GameDimensions
): number => {
  if (direction === 0) {
    return currentX;
  }

  const nextX = currentX + direction * settings.playerSpeed;
  return Math.max(0, Math.min(dimensions.width - dimensions.playerWidth, nextX));
};
