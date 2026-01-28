# 🥷 TypingNinja

> A high-octane, aesthetic typing survival game built with React, HTML5 Canvas, and the Web Audio API.

![Image](/Screenshot_2026-01-24_23-16-06.png)

## 📖 Overview

**TypingNinja** is a web-based arcade game inspired by *Fruit Ninja*, but played with your keyboard. Words are thrown into the air, and players must type them correctly to "slice" them before they hit the ground.

This project was built as a technical case study to demonstrate **hybrid rendering strategies** in React—using standard DOM for UI overlays and the HTML5 Canvas API for high-performance, 60FPS physics and particle rendering.

## ✨ Key Features

* **⚡ Hybrid Architecture:** Decoupled game logic loop using `requestAnimationFrame` and `useRef` for physics, separating it from React's render cycle to ensure buttery smooth performance.
* **🎨 Dynamic Theming System:** Instant visual switching between distinct aesthetics (**Neon City**, **Tabletop Wood**, **Void**) affecting backgrounds, fonts, particles, and element rendering styles.
* **🎵 Procedural Audio Engine:** A custom-built `MusicManager` and `SoundManager` that generate retro-style SFX and background music loops in real-time using the **Web Audio API** (Oscillators/GainNodes). No external MP3 assets are used!
* **🧠 Adaptive Difficulty:** The "Director" AI adjusts the spawn rate and word complexity based on the player's current performance (WPM and Combo).
* **⚙️ Custom Sandbox:** Players can manually set target WPM (Words Per Minute) and Word Length ranges to practice specific typing scenarios.
* **🏆 Local Persistence:** High scores and history are saved locally to the browser.

## 🛠️ Tech Stack

* **Core:** React.js (Hooks, Refs)
* **Graphics:** HTML5 Canvas API (2D Context)
* **UI Frameworks:** Material UI (MUI), Bootstrap 5
* **Audio:** Web Audio API (Native browser synthesis)
* **State Management:** React `useState` (UI) + Mutable Refs (Game Engine)

## 🚀 Getting Started

### Prerequisites
* Node.js (v14 or higher)
* npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone [https://github.com/yourusername/type-ninja.git](https://github.com/yourusername/type-ninja.git)
    cd type-ninja
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  Start the development server:
    ```bash
    npm start
    ```

4.  Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## 🕹️ How to Play

1.  **Type to Attack:** Type the letters of the words floating on the screen.
2.  **Target Locking:** Typing the first letter of a word "locks" onto it. You must finish that word before starting another.
3.  **Don't Miss:** If a word hits the bottom of the screen, you lose a life (Heart).
4.  **Combos:** Type consecutive words without mistakes to build your Combo Multiplier and score bonus points.
5.  **Pause:** Press `ESC` or `ENTER` to pause the game.

## 📂 Project Structure

```text
src/
├── TypeNinja.js       # Main Game Component & UI Logic
├── SoundManager.js    # Synthesized SFX (Web Audio API)
├── MusicManager.js    # Procedural Music Sequencer
├── dictionary.js      # Word lists and generators
├── index.js           # Entry point
└── ...
