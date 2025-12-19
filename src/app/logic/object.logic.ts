import { FallingObject, GameDimensions, GameSettings } from "../models/game.models";

export const spawnObject = (
  nextId: number,
  dimensions: GameDimensions
): FallingObject => {
  const x =
    Math.random() * (dimensions.width - dimensions.objectRadius * 2) +
    dimensions.objectRadius;

  return {
    id: nextId,
    x,
    y: 0,
    caught: false,
  };
};

export const advanceObjects = (
  objects: FallingObject[],
  settings: GameSettings,
  dimensions: GameDimensions
): FallingObject[] =>
  objects
    .map((object) => ({ ...object, y: object.y + settings.fallingSpeed }))
    .filter(
      (object) => object.y - dimensions.objectRadius < dimensions.height
    );

export const resolveObjectCatches = (
  objects: FallingObject[],
  playerX: number,
  dimensions: GameDimensions
): { remainingObjects: FallingObject[]; scoreIncrement: number } => {
  let scoreIncrement = 0;

  const remainingObjects = objects.filter((object) => {
    const reachedPlayer =
      object.y + dimensions.objectRadius >=
      dimensions.height - (dimensions.playerHeight + dimensions.playerOffset);
    const overlapX =
      object.x >= playerX - dimensions.objectRadius &&
      object.x <=
        playerX + dimensions.playerWidth + dimensions.objectRadius;

    if (reachedPlayer && overlapX) {
      scoreIncrement += 1;
      return false;
    }

    return true;
  });

  return { remainingObjects, scoreIncrement };
};
