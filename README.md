# Slots Mini-Game

A simple Angular mini-game where you move a rectangle to catch falling balls. Game parameters are configured through a reactive settings form, with live updates and a pseudo WebSocket feed that emits game state every second.

## Features
- Reactive settings form that instantly updates game parameters (falling speed, spawn frequency, player speed, game length).
- Game automatically restarts when the game time changes.
- Keyboard controls (arrow keys) to move the player.
- Collision detection and score counter for caught objects.
- Pseudo WebSocket updates every second showing objects caught and time remaining.

## Getting Started
The current Angular 17 toolchain uses Node.js 20 in CI. Both are legacy versions;
upgrading Angular and Node.js together is recommended as a separate maintenance task.

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Run the development server:
   ```bash
   npm start
   ```
3. Open your browser at the provided URL (default: http://localhost:4200/).

### Controls
- **Left/Right Arrow Keys**: Move the player horizontally to catch falling objects.

## GitHub Pages

Deployment URL (available after the first successful deployment):
https://krasny-lis.github.io/game/

1. Open the repository's **Settings → Pages** and select **GitHub Actions** as the source.
2. Merge the deployment configuration into `main`. Each push to `main` runs lint,
   builds the app, checks the generated asset paths, and publishes the static output.
3. Watch **Actions → Build and deploy game to GitHub Pages**. Both `build` and
   `deploy` must finish successfully.
4. To republish without changing code, select **Run workflow** on `main`.

Pull requests run the build checks but do not publish the site.

To verify the Pages build locally:

```bash
npm ci
npm run lint
npm run build:pages
npm run test:pages
```

The published directory is `dist/slot-game/browser`, not its parent directory.
The Pages build sets `<base href="/game/">` so scripts and styles load correctly
from the repository subdirectory. Local development still uses `/`.
The static-output checks verify generated paths and files, not gameplay in a browser.

The app has no server or real WebSocket connection. Its pseudo WebSocket feed is
an RxJS stream running locally in the browser, so no backend hosting is required.

## Notes
- The project uses strict TypeScript options and reactive programming with RxJS.
- Animations are kept simple for clarity; focus is on reactive logic and configuration.
