Robo Rebellion: Game Design Document
1. Game Overview
1.1 Concept
Robo Rebellion is a top-down shooter where players control combat robots fighting against waves of enemy machines. The game features fast-paced action, upgradeable abilities, and a wave-based progression system.

1.2 Target Audience
Casual and mid-core gamers
Ages 12+
Fans of arcade shooters and roguelite games
1.3 Game Pillars
Fast-paced Combat: Quick, responsive controls with minimal downtime
Progression: Increasing difficulty with meaningful rewards
Player Choice: Different robot types and play styles
2. Gameplay
2.1 Core Loop
Select robot character
Fight through waves of enemies
Collect powerups to enhance abilities
Defeat all enemies to progress to next wave
Continue until defeated
Compare score and try again
2.2 Game Flow
Start at main menu
Select robot character
Battle through increasingly difficult waves
Game ends when player is defeated
Score screen displays performance metrics
Return to main menu for another attempt
3. Game Mechanics
3.1 Movement
WASD or Arrow keys for 8-directional movement
Movement speed varies by robot type
3.2 Combat
Left-click to shoot in mouse direction
Automatic firing when holding mouse button
Bullets travel in straight lines
Damage values vary by robot type
3.3 Special Abilities
Space bar to dash (short invulnerable burst of speed)
3-second cooldown between dashes
Visual indicator shows dash availability
3.4 Wave System
Each wave spawns progressively more enemies
New enemy types introduced in later waves
Wave number displayed on screen
Brief respite between waves
4. Characters/Robots
4.1 Assault Bot
Color: Green (#4CAF50)
Health: 100
Speed: 220
Fire Rate: 0.2 (5 shots per second)
Bullet Damage: 20
Bullet Speed: 500
Play Style: Balanced, good all-around option
4.2 Tank Bot
Color: Yellow (#FFC107)
Health: 150
Speed: 160
Fire Rate: 0.4 (2.5 shots per second)
Bullet Damage: 30
Bullet Speed: 400
Play Style: Slower but more powerful, can absorb more damage
4.3 Stealth Bot
Color: Blue (#2196F3)
Health: 75
Speed: 250
Fire Rate: 0.15 (6.67 shots per second)
Bullet Damage: 15
Bullet Speed: 550
Play Style: Fast and agile with rapid fire, but fragile
5. Enemies
5.1 Chaser
Color: Orange (#FF5722)
Health: 30 + (wave × 5)
Speed: 150
Behavior: Directly charges player
Attack: Contact damage (10)
Points: 100
Appearance: First wave
5.2 Shooter
Color: Purple (#673AB7)
Health: 20 + (wave × 3)
Speed: 100
Behavior: Maintains distance, fires at player
Attack: Ranged bullets (8 damage)
Points: 150
Appearance: Wave 2+
5.3 Tank
Color: Brown (#795548)
Health: 60 + (wave × 10)
Speed: 75
Behavior: Slow movement, fires in multiple directions
Attack: Contact damage (15) and heavy bullets (12 damage)
Points: 250
Appearance: Wave 3+
6. Powerups and Items
6.1 Health Pack
Color: Green (#4CAF50)
Effect: Restores 30 health
Duration: Instant
Appearance: Plus sign icon
Spawn Rate: 50% chance from defeated enemies
6.2 Rapid Fire
Color: Yellow (#FFEB3B)
Effect: Doubles fire rate
Duration: 10 seconds
Appearance: Lightning bolt icon
Spawn Rate: 30% chance from defeated enemies
6.3 Damage Boost
Color: Red (#F44336)
Effect: Increases bullet damage by 50%
Duration: 10 seconds
Appearance: Star icon
Spawn Rate: 20% chance from defeated enemies
7. Game Environment
7.1 World
2000×2000 pixel game area
Grid-based background for visual reference
Border to mark playable area
7.2 Camera
Centered on player
Smooth follow behavior
Shows appropriate view of battlefield
8. User Interface
8.1 HUD Elements
Health bar (top-left)
Score counter (top-right)
Wave indicator (bottom-left)
Dash cooldown indicator (circular overlay)
Weapon/powerup status (when active)
8.2 Start Screen
Game title
Character selection with visual indicators
Start button
Basic control information
8.3 Game Over Screen
"Mission Failed" message
Final score
Waves cleared
Restart button
8.4 In-Game Messages
Wave announcements
Powerup notifications
Tutorial hints (first play)
9. Visual Style
9.1 Art Direction
Clean, minimalist geometric shapes
Vibrant color palette to distinguish different elements
Simple but readable UI
Particle effects for feedback (explosions, hits)
9.2 Animation
Smooth transitions
Explosion particle effects
Feedback animations for hits and damage
UI element animations (fade-ins, slide transitions)
10. Audio
10.1 Sound Effects
Shooting sounds
Enemy death explosions
Powerup collection
Player damage/hit
Game over sound
UI interaction sounds
10.2 Music
Upbeat electronic soundtrack
Menu theme
Main gameplay theme
Game over theme
11. Technical Specifications
11.1 Platform
Web browser (desktop and mobile)
HTML5 Canvas for rendering
Vanilla JavaScript implementation
11.2 Performance Targets