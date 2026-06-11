# 🛞 CAPYWHEELS

An adrenaline-pumping, high-momentum retro arcade driving game implemented in pure native HTML5 Canvas, JavaScript (ES6), and standard CSS, now fully powered by an **asset-free procedural Web Audio API Synthesizer Engine**.

Speed down infinite winding procedural tracks, gather fresh oranges to maintain your streak, steer around hazardous bananas, and survive the journey as the fastest racing capybara on wheels.

---

## 🎨 Professional Key Features

### 1. 🔊 Procedural Web Audio Synth Engine (100% Asset-Free)
To deliver dynamic retro sound with zero network loading latency or legal copyright concerns, we engineered a dedicated chiptune and synthesizer subsystem:
* **Interactive Background Music**: A live 4-bar chord loop Sequencer running at **135 BPM** in an A-pentatonic-minor key. Contains double-time driving synthwave basslines, deep low-pass kick drums, noise high-hats, and square-wave lead arpeggios that change dynamically.
* **Smart Motor Engine Hum**: Generates a continuous sawtooth engine wave. Timbre, cutoff frequency, and pitch dynamically glide upwards and downwards in real-time according to the capybara's speed and off-road grass-friction vibration.
* **Combo-Pitched Chimes**: Orange collection triggers a beautifully shimmering dual-oscillator chime. Successive pick-ups within the combo timer window dynamically scale up the pitch for heightened audio-tactile rewards.
* **Low-End Crash & Sad Cadence**: Banana impacts trigger an explosive bandpass-filtered white noise blast paired with a descending sad minor-chord sweep.

### 2. ⚡ Pure Momentum Mechanics
* Avoid letting your **momentum meter** drop below zero!
* Drifting off the road on the grass will rapidly decelerate your wheels, causing raw engine rumble feedback and grass particles.
* Consistently chaining orange pickups scales up your combo multipliers for maximum score potential.

### 3. ✨ High Fidelity Particles & FX
* Dynamic visual dust plumes and grass clipping particles are emitted behind your spinning wheels.
* Dynamic screen color flashes representing critical collision states (gold-shimmer for oranges, deep red for banana crashes).

---

## 🎮 How to Play

1. **Controls**:
   * **Left / Right Arrow Keys** (or **A / D Keys**) — Steer and control your capybara.
   * **Up Arrow** (or **W Key**) — Accelerate up to maximum speed.
   * **Down Arrow** (or **S Key**) — Brake and reverse direction.
2. **Audio Controls**:
   * Interactive **Music** and **SFX** toggles are placed at the top of the screen to quickly adjust sound parameters at will.
3. **Objective**:
   * Avoid crashing into bananas. High momentum means faster speed. If your momentum reaches zero, the game ends.

---

## 📂 Codebase Architecture

```
├── /assets/               # Game metadata configuration artifacts
├── /src/                  # Entry point React framework configurations
├── /AudioEngine.js        # Web Audio API Synthesizer Class (Music Sequencer, Engine Synth, SFX Nodes)
├── /Config.js             # General track widths, particle count, and physics scale factors
├── /Game.js               # Central Game Loop Orchestrator holding updates, collisions, HUD, and audio states
├── /Input.js              # Native Keyboard and touch interaction state monitors
├── /Particles.js          # High-performance pixel and trail rendering loops
├── /Player.js             # Capybara physics, steering vectors, boundaries, and friction logic
├── /Track.js              # Procedural pseudo-3D perspective curves and track segment generators
├── /style.css             # Fluid responsive retro arcade overlay visuals
└── /index.html            # Main markup and UI layers
```

---

## 🚀 Local Installation & Execution

To boot the development environment of **CapyWheels** with real-time browser preview, make sure you have [Node.js](https://nodejs.org/) installed, and run:

```bash
# Install core build dependencies
npm install

# Start the development server
npm run dev
```

Your server will spin up on **http://localhost:3000** instantly.

---

## 📜 License
Highly optimized and designed with care. Open source and distributed under the standard **MIT License**.
