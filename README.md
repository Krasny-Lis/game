# Catch the Falling Objects – Angular Mini-Game

[![Build and deploy game to GitHub Pages](https://github.com/Krasny-Lis/game/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Krasny-Lis/game/actions/workflows/deploy-pages.yml)

Configurable browser mini-game built with Angular, NgRx and RxJS. The player moves horizontally to catch falling objects while reactive streams control gameplay, timing and a simulated live-status feed.

**Live demo:** https://krasny-lis.github.io/game/

## What this project demonstrates

- reactive game state managed with NgRx
- timer and animation events modeled as actions and effects
- typed reactive-form controls with live configuration updates
- RxJS streams for game snapshots and periodic status messages
- immutable reducers separated by responsibility
- keyboard interaction and programmatic focus management
- strict TypeScript configuration
- automated linting, production build and static-output verification

## Gameplay

1. Configure falling speed, spawn frequency, player speed and game duration.
2. Start the game.
3. Use the left and right arrow keys to move the player.
4. Catch as many falling objects as possible before the timer reaches zero.

Changing most settings updates the running game immediately. Changing the game duration restarts the session with the new value.

## Technology stack

| Area | Technology |
| --- | --- |
| Application | Angular 17, TypeScript |
| State | NgRx Store and Effects |
| Reactive logic | RxJS |
| Forms | Angular typed reactive forms |
| Quality | Angular ESLint, strict TypeScript |
| Hosting | GitHub Pages |

## Architecture notes

The UI reads a derived `GameSnapshot` stream. User actions are dispatched through `GameService`, while reducers and effects handle settings, frame updates, object spawning and the timer.

`GameSocketService` simulates a WebSocket-like feed by publishing the current score and remaining time every second. It does not connect to an external server.

## Run locally

The current Angular 17 toolchain uses Node.js 20.

```bash
npm ci
npm start
```

## Quality checks

```bash
npm run lint
npm run build:pages
npm run test:pages
```

`test:pages` verifies the generated static files and asset paths. The repository does not currently contain gameplay unit tests.

## Deployment

Pull requests to `main` run linting, the GitHub Pages build and static-output checks. A push to `main` also deploys `dist/slot-game/browser`.

The production build uses `/game/` as its base path. Local development continues to use `/`.

## Project status

Complete portfolio demo. A future Angular upgrade and gameplay unit tests are maintenance improvements, not requirements for the current release.
