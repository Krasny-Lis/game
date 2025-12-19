import { bootstrapApplication } from "@angular/platform-browser";
import { provideEffects } from "@ngrx/effects";
import { provideStore } from "@ngrx/store";
import { AppComponent } from "./app/app.component";
import { GameEffects } from "./app/store/effects/game.effects";
import { gameReducer } from "./app/store/game.reducer";

bootstrapApplication(AppComponent, {
  providers: [provideStore({ game: gameReducer }), provideEffects(GameEffects)],
}).catch((err) => console.error(err));
