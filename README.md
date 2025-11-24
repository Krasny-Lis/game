# Slots Mini-Game

A simple Angular mini-game where you move a rectangle to catch falling balls. Game parameters are configured through a reactive settings form, with live updates and a pseudo WebSocket feed that emits game state every second.

## Features
- Reactive settings form that instantly updates game parameters (falling speed, spawn frequency, player speed, game length).
- Game automatically restarts when the game time changes.
- Keyboard controls (arrow keys) to move the player.
- Collision detection and score counter for caught objects.
- Pseudo WebSocket updates every second showing objects caught and time remaining.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm start
   ```
3. Open your browser at the provided URL (default: http://localhost:4200/).

### Controls
- **Left/Right Arrow Keys**: Move the player horizontally to catch falling objects.

## Notes
- The project uses strict TypeScript options and reactive programming with RxJS.
- Animations are kept simple for clarity; focus is on reactive logic and configuration.
