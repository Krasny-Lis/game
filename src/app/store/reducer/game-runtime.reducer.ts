import { GAME_DIMENSIONS } from "../../models/game.models";
import { advanceObjects, resolveObjectCatches, spawnObject } from "../../logic/object.logic";
import { movePlayer } from "../../logic/player.logic";
import { GameState } from "../game.state";

export const onAdvanceFrame = (state: GameState): GameState => {
  if (!state.running) {
    return state;
  }

  const playerX = movePlayer(state.playerX, state.direction, state.settings, GAME_DIMENSIONS);
  const updatedObjects = advanceObjects(state.objects, state.settings, GAME_DIMENSIONS);
  const { remainingObjects, scoreIncrement } = resolveObjectCatches(
    updatedObjects,
    playerX,
    GAME_DIMENSIONS
  );

  return {
    ...state,
    playerX,
    objects: remainingObjects,
    score: state.score + scoreIncrement,
  };
};

export const onSpawnObject = (state: GameState): GameState => {
  if (!state.running) {
    return state;
  }

  const nextObjectId = state.nextObjectId + 1;
  const newObject = spawnObject(nextObjectId, GAME_DIMENSIONS);

  return {
    ...state,
    nextObjectId,
    objects: [...state.objects, newObject],
  };
};
