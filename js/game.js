// Main Game Controller
class Game {
    constructor() {
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      
      this.state = 'start'; // start, playing, gameover
      this.score = 0;
      this.roomsCleared = 0;
      
      this.player = null;
      this.dungeon = null;
      this.currentRoom = null;
      this.enemies = [];
      this.bullets = [];
      this.powerups = [];
      
      this.mouse = { x: 0, y: 0 };
      this.keys = {};
      
      this.lastTime = 0;
      this.animationFrame = null;
      
      this.setupEventListeners();
      this.ui = new UI(this);
      
      this.transitionState = {
        active: false,
        progress: 0,
        duration: 500, // milliseconds
        fromRoom: null,
        toRoom: null,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      };

      this.unlockedWeapons = ['basicLaser']; // Start with basic weapon only
    }
    
    setupEventListeners() {
      // Character selection
      document.querySelectorAll('.character').forEach(char => {
        char.addEventListener('click', () => {
          document.querySelectorAll('.character').forEach(c => c.classList.remove('selected'));
          char.classList.add('selected');
        });
      });
      
      // Start game button
      document.getElementById('start-game').addEventListener('click', () => {
        const selectedChar = document.querySelector('.character.selected');
        if (selectedChar) {
          this.startGame(selectedChar.dataset.type);
        } else {
          // Default to assault if none selected
          this.startGame('assault');
        }
      });
      
      // Restart game button
      document.getElementById('restart-game').addEventListener('click', () => {
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        this.state = 'start';
      });
      
      // Keyboard events
      window.addEventListener('keydown', e => {
        this.keys[e.key] = true;
        
        // Spacebar for dash
        if (e.key === ' ' && this.player && !this.player.isDashing && this.player.dashCooldown <= 0) {
          this.player.dash();
        }
      });
      
      window.addEventListener('keyup', e => {
        this.keys[e.key] = false;
      });
      
      // Mouse events
      this.canvas.addEventListener('mousemove', e => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });
      
      this.canvas.addEventListener('mousedown', e => {
        if (this.state !== 'playing') return;
        
        if (e.button === 0) { // Left click
          this.player.shoot(this.mouse);
        } else if (e.button === 2) { // Right click
          this.player.useSpecialAbility();
        }
      });
      
      // Prevent context menu on right click
      this.canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
      });
      
      // Handle window resize
      window.addEventListener('resize', () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      });
    }
    
    startGame(robotType) {
      this.state = 'playing';
      this.score = 0;
      this.roomsCleared = 0;
      
      // Initialize player based on selected robot type
      this.player = new Player(
        this.canvas.width / 2,
        this.canvas.height / 2,
        robotType,
        this
      );
      
      // Generate dungeon
      this.dungeon = new Dungeon(10, 8, this);
      this.currentRoom = this.dungeon.startRoom;
      
      // Hide start screen, show HUD
      document.getElementById('start-screen').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      
      // Update HUD
      this.ui.updateHealthBar();
      this.ui.updateEnergyBar();
      this.ui.updateWeaponInfo();
      
      // Start game loop
      this.lastTime = performance.now();
      this.gameLoop();
    }
    
    gameLoop(timestamp = 0) {
      const deltaTime = timestamp - this.lastTime;
      this.lastTime = timestamp;
      
      this.update(deltaTime / 1000); // Convert to seconds
      this.render();
      
      if (this.state === 'playing') {
        this.animationFrame = requestAnimationFrame(time => this.gameLoop(time));
      }
    }
    
    update(deltaTime) {
      if (this.state !== 'playing') return;
      
      // Update player
      this.player.update(deltaTime, this.keys);
      
      // Update room transitions
      this.checkRoomTransition();
      this.updateRoomTransition(deltaTime);
      
      // Update bullets
      this.updateBullets(deltaTime);
      
      // Update enemies
      this.updateEnemies(deltaTime);
      
      // Update powerups
      this.updatePowerups();
      
      // Check if player is dead
      if (this.player.health <= 0) {
        this.gameOver();
      }
    }
    
    updateBullets(deltaTime) {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        bullet.update(deltaTime);
        
        // Check if bullet is out of bounds
        if (
          bullet.x < this.currentRoom.x ||
          bullet.x > this.currentRoom.x + this.currentRoom.width ||
          bullet.y < this.currentRoom.y ||
          bullet.y > this.currentRoom.y + this.currentRoom.height
        ) {
          this.bullets.splice(i, 1);
          continue;
        }
        
        // Check bullet collisions
        if (bullet.fromPlayer) {
          // Check enemy collisions
          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (this.checkCollision(bullet, enemy)) {
              enemy.takeDamage(bullet.damage);
              if (enemy.health <= 0) {
                this.score += enemy.points;
                this.ui.updateScore();
                
                // Chance to spawn powerup
                if (Math.random() < 0.3) {
                  this.spawnPowerup(enemy.x, enemy.y);
                }
                
                this.enemies.splice(j, 1);
              }
              
              this.bullets.splice(i, 1);
              break;
            }
          }
        } else {
          // Check player collision
          if (this.checkCollision(bullet, this.player) && !this.player.isInvulnerable) {
            this.player.takeDamage(bullet.damage);
            this.ui.updateHealthBar();
            this.bullets.splice(i, 1);
          }
        }
      }
    }
    
    updateEnemies(deltaTime) {
      // Spawn enemies if room not cleared
      if (this.enemies.length === 0 && !this.currentRoom.cleared) {
        this.spawnEnemies();
      }
      
      // Update existing enemies
      this.enemies.forEach(enemy => {
        enemy.update(deltaTime, this.player);
        
        // Check collision with player
        if (this.checkCollision(enemy, this.player) && !this.player.isInvulnerable) {
          this.player.takeDamage(enemy.contactDamage);
          this.ui.updateHealthBar();
          
          // Knockback player
          const angle = Math.atan2(
            this.player.y - enemy.y,
            this.player.x - enemy.x
          );
          this.player.x += Math.cos(angle) * 15;
          this.player.y += Math.sin(angle) * 15;
        }
      });
    }
    
    updatePowerups() {
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const powerup = this.powerups[i];
        
        // Check collision with player
        if (this.checkCollision(powerup, this.player)) {
          powerup.apply(this.player);
          this.powerups.splice(i, 1);
          
          // Update UI
          this.ui.updateHealthBar();
          this.ui.updateEnergyBar();
          this.ui.updateWeaponInfo();
        }
      }
    }
    
    checkRoomTransition() {
      if (this.transitionState.active) return;
      
      const player = this.player;
      const room = this.currentRoom;
      
      // Only allow transition if room is cleared of enemies
      if (this.enemies.length > 0) return;
      this.currentRoom.cleared = true;
      
      // Check if player is at a door
      const padding = 20;
      let nextRoom = null;
      let startPos = { x: player.x, y: player.y };
      let endPos = { x: player.x, y: player.y };
      
      // Door checks with similar logic but storing positions instead of teleporting
      if (player.x < room.x + padding && room.leftDoor) {
        nextRoom = this.dungeon.rooms.find(r => r.id === room.leftDoor);
        if (nextRoom) {
          endPos.x = nextRoom.x + nextRoom.width - player.width - padding;
          endPos.y = nextRoom.y + nextRoom.height / 2 - player.height / 2;
        }
      }
      // Right door
      else if (player.x + player.width > room.x + room.width - padding && room.rightDoor) {
        nextRoom = this.dungeon.rooms.find(r => r.id === room.rightDoor);
        if (nextRoom) {
          endPos.x = nextRoom.x + padding;
          endPos.y = nextRoom.y + nextRoom.height / 2 - player.height / 2;
        }
      }
      // Top door
      else if (player.y < room.y + padding && room.topDoor) {
        nextRoom = this.dungeon.rooms.find(r => r.id === room.topDoor);
        if (nextRoom) {
          endPos.x = nextRoom.x + nextRoom.width / 2 - player.width / 2;
          endPos.y = nextRoom.y + nextRoom.height - player.height - padding;
        }
      }
      // Bottom door
      else if (player.y + player.height > room.y + room.height - padding && room.bottomDoor) {
        nextRoom = this.dungeon.rooms.find(r => r.id === room.bottomDoor);
        if (nextRoom) {
          endPos.x = nextRoom.x + nextRoom.width / 2 - player.width / 2;
          endPos.y = nextRoom.y + padding;
        }
      }
      
      // Start transition if we found a next room
      if (nextRoom) {
        this.transitionState = {
          active: true,
          progress: 0,
          duration: 500,
          fromRoom: this.currentRoom,
          toRoom: nextRoom,
          startX: startPos.x,
          startY: startPos.y,
          endX: endPos.x,
          endY: endPos.y
        };
      }
    }
    
    updateRoomTransition(deltaTime) {
      if (!this.transitionState.active) return;
      
      // Update transition progress
      const transitionMs = deltaTime * 1000;
      this.transitionState.progress += transitionMs;
      
      // Calculate transition factor (0 to 1)
      const factor = Math.min(1, this.transitionState.progress / this.transitionState.duration);
      
      // Apply smooth interpolation
      this.player.x = this.transitionState.startX + (this.transitionState.endX - this.transitionState.startX) * factor;
      this.player.y = this.transitionState.startY + (this.transitionState.endY - this.transitionState.startY) * factor;
      
      // Complete the transition
      if (factor >= 1) {
        this.currentRoom = this.transitionState.toRoom;
        this.roomsCleared++;
        this.bullets = []; // Clear bullets when changing rooms
        this.transitionState.active = false;
      }
    }
    
    spawnEnemies() {
      const room = this.currentRoom;
      if (room.isSafeRoom) return; // Don't spawn enemies in safe room
      
      const roomWidth = room.width;
      const roomHeight = room.height;
      const roomX = room.x;
      const roomY = room.y;
      
      const enemyCount = Math.floor(Math.random() * 3) + 2; // 2-4 enemies
      
      for (let i = 0; i < enemyCount; i++) {
        // Randomly select enemy type
        const enemyType = Math.random();
        let enemy;
        
        if (enemyType < 0.6) {
          // Scout Drone (60% chance)
          enemy = new ScoutDrone(
            roomX + 100 + Math.random() * (roomWidth - 200),
            roomY + 100 + Math.random() * (roomHeight - 200),
            this
          );
        } else if (enemyType < 0.9) {
          // Heavy Sentry (30% chance)
          enemy = new HeavySentry(
            roomX + 100 + Math.random() * (roomWidth - 200),
            roomY + 100 + Math.random() * (roomHeight - 200),
            this
          );
        } else {
          // Sniper Bot (10% chance)
          enemy = new SniperBot(
            roomX + 100 + Math.random() * (roomWidth - 200),
            roomY + 100 + Math.random() * (roomHeight - 200),
            this
          );
        }
        
        this.enemies.push(enemy);
      }
    }
    
    spawnPowerup(x, y) {
      const type = Math.random();
      let powerup;
      
      if (type < 0.4) {
        powerup = new HealthPack(x, y);
      } else if (type < 0.8) {
        powerup = new EnergyCell(x, y);
      } else {
        powerup = new WeaponUpgrade(x, y, getRandomWeapon());
      }
      
      this.powerups.push(powerup);
    }
    
    checkCollision(obj1, obj2) {
      return (
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y
      );
    }
    
    render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Calculate camera position (center on player)
      const cameraX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
      const cameraY = this.player.y + this.player.height / 2 - this.canvas.height / 2;
      
      // Render current room
      this.currentRoom.render(this.ctx, cameraX, cameraY);
      
      // Render powerups
      this.powerups.forEach(powerup => {
        powerup.render(this.ctx, cameraX, cameraY);
      });
      
      // Render player
      this.player.render(this.ctx, cameraX, cameraY);
      
      // Render enemies
      this.enemies.forEach(enemy => {
        enemy.render(this.ctx, cameraX, cameraY);
      });
      
      // Render bullets
      this.bullets.forEach(bullet => {
        bullet.render(this.ctx, cameraX, cameraY);
      });
      
      // Render special ability cooldown
      this.ui.updateSpecialCooldown();
    }
    
    gameOver() {
      this.state = 'gameover';
      cancelAnimationFrame(this.animationFrame);
      
      document.getElementById('hud').classList.add('hidden');
      document.getElementById('final-score').textContent = this.score;
      document.getElementById('rooms-cleared').textContent = this.roomsCleared;
      document.getElementById('game-over').classList.remove('hidden');
    }
  }
  
  // Initialize game when window loads
  window.addEventListener('load', () => {
    const game = new Game();
  });

// Modify the Player class shoot method to check if weapon is unlocked
shoot(targetPos) {
  if (!this.game.unlockedWeapons.includes(this.currentWeapon.id)) {
    this.game.ui.showMessage(`You haven't found the ${this.currentWeapon.name} yet!`);
    return;
  }
  
  
}

// Update WeaponUpgrade class
class WeaponUpgrade {
  apply(player) {
    if (!player.game.unlockedWeapons.includes(this.weapon.id)) {
      player.game.unlockedWeapons.push(this.weapon.id);
      player.game.ui.showMessage(`Acquired ${this.weapon.name}!`, 2000);
      player.currentWeapon = this.weapon;
    } else {
      player.game.ui.showMessage(`Weapon upgrade for ${this.weapon.name}!`, 2000);
      // Maybe increase weapon damage or reduce energy cost
    }
  }
}

// In your Dungeon class constructor
createSafeRoom() {
  // Find or create a room to be the safe room
  const safeRoom = this.rooms[0]; // Make first room safe
  safeRoom.isSafeRoom = true;
  safeRoom.cleared = true; // Already cleared
  
  // Add special visuals and health packs
  safeRoom.color = '#3a5c70'; // Different color
  
  // Spawn initial health pack and weapon in safe room
  this.game.powerups.push(new HealthPack(
    safeRoom.x + safeRoom.width * 0.3,
    safeRoom.y + safeRoom.height * 0.5
  ));
  
  this.game.powerups.push(new EnergyCell(
    safeRoom.x + safeRoom.width * 0.7,
    safeRoom.y + safeRoom.height * 0.5
  ));
  
  this.startRoom = safeRoom;
}

// Add to UI class
showMessage(text, duration = 2000) {
  const msgElement = document.createElement('div');
  msgElement.className = 'game-message';
  msgElement.textContent = text;
  document.getElementById('message-container').appendChild(msgElement);
  
  // Fade out and remove
  setTimeout(() => {
    msgElement.classList.add('fade-out');
    setTimeout(() => msgElement.remove(), 500);
  }, duration);
}