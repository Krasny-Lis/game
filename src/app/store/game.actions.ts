import { createActionGroup, emptyProps, props } from "@ngrx/store";
import { Direction, GameSettings } from "../models/game.models";

export const gameActions = createActionGroup({
  source: "Game",
  events: {
    "Update Settings": props<{ settings: Partial<GameSettings> }>(),
    "Start Game": props<{ settings: GameSettings }>(),
    "Stop Game": emptyProps(),
    "Update Direction": props<{ direction: Direction }>(),
    "Advance Frame": emptyProps(),
    "Spawn Object": emptyProps(),
    "Tick Timer": emptyProps(),
  },
});
