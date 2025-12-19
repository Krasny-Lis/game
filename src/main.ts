import { bootstrapApplication } from "@angular/platform-browser";
import { provideStore } from "@ngrx/store";
import { AppComponent } from "./app/app.component";
import { gameReducer } from "./app/store/game.reducer";

bootstrapApplication(AppComponent, {
  providers: [provideStore({ game: gameReducer })],
}).catch((err) => console.error(err));
