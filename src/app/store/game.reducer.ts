import { createReducer, on } from "@ngrx/store";
import { GAME_DIMENSIONS } from "../models/game.models";
import {
  advanceObjects,
  resolveObjectCatches,
  spawnObject,
} from "../logic/object.logic";
import { movePlayer, getInitialPlayerX } from "../logic/player.logic";
import { gameActions } from "./game.actions";
import { DEFAULT_DIRECTION, GameState, initialGameState } from "./game.state";

const clampTimeRemaining = (value: number): number => Math.max(value, 0);

const resetState = (
  state: GameState,
  settings: GameState["settings"]
): GameState => ({
  ...state,
  settings: { ...settings },
  playerX: getInitialPlayerX(GAME_DIMENSIONS),
  objects: [],
  score: 0,
  timeRemaining: settings.gameTime,
  direction: DEFAULT_DIRECTION,
  running: true,
  nextObjectId: 0,
});

export const gameReducer = createReducer(
  initialGameState,
  on(gameActions.updateSettings, (state, { settings }) => {
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
  }),
  on(gameActions.startGame, (state, { settings }) =>
    resetState(state, settings)
  ),
  on(gameActions.stopGame, (state) => ({
    ...state,
    running: false,
    direction: DEFAULT_DIRECTION,
    objects: [],
  })),
  on(gameActions.updateDirection, (state, { direction }) => {
    if (!state.running || state.direction === direction) {
      return state;
    }
    return { ...state, direction };
  }),
  on(gameActions.advanceFrame, (state) => {
    if (!state.running) {
      return state;
    }

    const playerX = movePlayer(
      state.playerX,
      state.direction,
      state.settings,
      GAME_DIMENSIONS
    );
    const updatedObjects = advanceObjects(
      state.objects,
      state.settings,
      GAME_DIMENSIONS
    );
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
  }),
  on(gameActions.spawnObject, (state) => {
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
  }),
  on(gameActions.tickTimer, (state) => {
    if (!state.running) {
      return state;
    }

    if (state.timeRemaining <= 0) {
      return {
        ...state,
        running: false,
        direction: DEFAULT_DIRECTION,
        objects: [],
      };
    }

    return {
      ...state,
      timeRemaining: clampTimeRemaining(state.timeRemaining - 1),
    };
  })
);
