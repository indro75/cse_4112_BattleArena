# AI Battle Arena ⚔️🤖

A complete, playable **2D Cyberpunk AI Battle Arena Game** built from the ground up with HTML5 Canvas, CSS3, and vanilla modern JavaScript.

In **AI Battle Arena**, you step into the boots of a cyber warrior facing off against **NEXUS-9**, an intelligent neural combat synthetic operating inside a high-tech battle colosseum.

---

## 🎮 How to Play

Run the game directly in any modern web browser:
- Open `index.html` directly in your browser (Chrome, Firefox, Edge, Safari, Opera), or serve it via any static local HTTP server (e.g. `npx serve`, Python `http.server`, or VS Code Live Server).

### 🕹️ Controls (Desktop & Mobile)

| Action | Keyboard Primary | Keyboard Secondary | Mobile Touch Button |
|---|---|---|---|
| **Move Left** | `A` | `←` (Left Arrow) | Left D-Pad `◀` |
| **Move Right** | `D` | `→` (Right Arrow) | Right D-Pad `▶` |
| **Jump** | `W` | `↑` (Up Arrow) / `Space` | Top D-Pad `▲` |
| **Crouch / Drop** | `S` | `↓` (Down Arrow) | Bottom D-Pad `▼` |
| **Basic Attack** | `J` | `Z` | `⚔️ ATTACK` (3-Hit Combo Chain) |
| **Special Attack** | `K` | `X` | `⚡ SPECIAL` (Plasma Blast - Costs 40 SP) |
| **Block** | `L` | `C` | `🛡️ BLOCK` (Hold to absorb 75% Damage) |
| **Dodge / Dash** | `Shift` (Left or Right) | — | `💨 DASH` (Invulnerability i-Frames) |
| **Pause / Resume** | `Esc` | `P` | Top Center `⏸` Button |

### 📱 Mobile Device Support
- **On-Screen Virtual Gamepad**: Automatic detection of touchscreens and mobile viewports with an ergonomic dual-thumb layout (directional D-Pad on the left, combat action cluster on the right).
- **Multi-Touch Support**: Run, jump, and strike concurrently with fluid multi-finger input tracking.
- **Responsive Viewport Adaptability**: Fits phones and tablets in landscape mode (`100vw`/`100vh`) and portrait mode with automated orientation recommendations.
- **Configurable in Settings**: Set virtual touch controls to `Auto-Detect`, `Always Show`, or `Always Hide`.

---

## 🧠 Intelligent AI Architecture

Unlike typical simple arcade games with randomized movement, **NEXUS-9** is powered by three interconnected algorithmic subsystems:

### 1. Finite State Machine (FSM)
Governs tactical behavioral states:
- `IDLE`: Neutral battlefield evaluation and opponent tracking.
- `CHASE`: Intelligent closing of distance and dynamic spacing.
- `ATTACK`: Rhythmically executes single strikes or multi-hit combo chains.
- `DEFEND`: Raises directional energy shield when facing incoming attacks.
- `DODGE`: Performs high-speed invulnerable dash rolls to avoid projectiles or escape corners.
- `COUNTERATTACK`: Instantly launches a counter-strike after blocking an opponent's attack or punishing a whiff.
- `RETREAT`: Backs off when low health or when spacing for ranged combat.
- `SPECIAL_ATTACK`: Fires concentrated plasma beam blasts across the arena.

### 2. Behavior Tree (BT)
Organized into an evaluative hierarchy of **Selectors**, **Sequences**, **Conditions**, and **Actions**:
1. **Urgent Threat Evaluation**: Detects incoming player weapon hitboxes and projectiles to trigger immediate defensive blocks or dodge rolls.
2. **Whiff Punish**: Identifies when the player attacks out of range or is recovering from landing, immediately closing the gap to counter.
3. **Anti-Air Intercept**: Detects airborne jumps and launches jump-strikes or uppercuts to swat the player out of the air.
4. **Special Blast Ranged Attack**: Unleashes charged projectiles when energy is available and range is advantageous.
5. **Melee Assault**: Executes multi-hit combos when in close combat range.
6. **Adaptive Counter-Tactics**: Specifically tailored responses based on player tendencies.

### 3. Real-Time Pattern Recognition (`PatternTracker`)
Maintains a sliding 12-second analytical window of player actions:
- **Jump Tendency**: Tracks how frequently the player jumps to predict landing zones and execute anti-air moves.
- **Attack Spam Tendency**: Measures attack frequency to bait whiffs, block relentlessly, and punish cooldown windows.
- **Guard Tendency**: Recognizes defensive turtling and pressures with special guard-crushing blasts or spaces for openings.
- **Preferred Distance**: Evaluates whether the player is a close-range brawler or long-range zoner.

### 4. Difficulty Modes
- **Easy Mode**: Slower reaction time (~450ms), attacks occasionally, rarely blocks (15%), predictable linear movement.
- **Medium Mode**: Balanced tactical android with ~180ms reaction time, blocks 55% of attacks, dodges threats, counters after blocks, and chains 2-hit combos.
- **Hard Mode**: Pro esports reflex tier (~60ms reaction speed), full predictive movement (leads projectile shots, calculates jump trajectories), strategic i-frame dodge rolls behind the player, adaptive pattern punishment, and full 3-hit combo chains into special finishers.

---

## 🎨 Visual & Audio Polish

- **Atmospheric Cyberpunk Arena**: Multi-layer parallax background with dark neon skyscrapers, sweeping atmospheric spotlights, central animated holographic billboard, laser containment boundary posts, and a high-tech metallic floor platform with glossy drop reflections.
- **Procedural 2D Pixel-Art Character Renderer**: Articulated limbs, glowing cyber helmets, energy chest cores, flowing physical scarf/cape, and dynamic plasma katana trails.
- **Combat Feedback**: Floating damage numbers (`-65`, `-180 CRITICAL!`, `BLOCK!`, `DODGE!`), spark particles, cyber-blood plasma bursts, shield hexagon barriers, shockwave rings, and screen shake with hitstop freeze-frames on heavy impacts.
- **Web Audio API Procedural Synthesizer**: 100% self-contained audio with zero external asset dependencies or CORS loading errors. Generates retro-futuristic sound effects and a driving 4-bar electro-synthwave combat soundtrack in real-time.
- **AI Neural Core Debug Inspector**: A toggleable HUD panel in the bottom-right corner displaying the AI's active FSM State, Behavior Tree node, target distance, tracked player habit bars, and predicted actions in real-time.

---

## 📁 Project Structure

```
AI_Battle_Arena/
├── index.html                   # Game viewport shell & UI overlays
├── css/
│   └── style.css                # Cyberpunk dark/neon UI styling & animations
├── js/
│   ├── engine/
│   │   ├── Audio.js             # Web Audio synthesizer for SFX and dynamic BGM
│   │   ├── Input.js             # Keyboard input manager with state tracking
│   │   ├── Camera.js            # Smooth tracking, dynamic zoom & screen shake
│   │   ├── Particles.js         # Sparks, plasma, dust, shields & ghost trails
│   │   └── Game.js              # 60 FPS fixed-timestep game engine & orchestrator
│   ├── arena/
│   │   └── Arena.js             # Cyberpunk colosseum renderer & parallax layers
│   ├── combat/
│   │   ├── Hitbox.js            # AABB intersection math & hitbox definitions
│   │   ├── CombatSystem.js      # Damage, blocking, dodging, hitstop & combos
│   │   └── DamageText.js        # Floating numeric combat damage & status text
│   ├── entities/
│   │   ├── Projectile.js        # Energy blast projectiles
│   │   ├── Fighter.js           # Base combatant physics & procedural 2D rendering
│   │   ├── Player.js            # Player controller mapping inputs to fighter actions
│   │   └── AIPlayer.js          # AI opponent entity powered by AIController
│   ├── ai/
│   │   ├── PatternTracker.js    # Real-time player habit & tendency analyzer
│   │   ├── FSM.js               # Finite State Machine for combat postures
│   │   ├── BehaviorTree.js      # Behavior Tree framework (Selector, Sequence, etc.)
│   │   └── AIController.js      # High-level AI coordination & difficulty tuning
│   ├── ui/
│   │   └── UIManager.js         # HUD, menus, modals, settings & results screens
│   └── main.js                  # Entry point initializing the game on DOM load
└── README.md
```
