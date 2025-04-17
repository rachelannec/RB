class RoboRebellion {
  constructor() {
    // Get canvas and context
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas to full window size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Game state
    this.state = 'menu'; // menu, playing, gameover
    this.score = 0;
    this.wave = 1;
    this.waveEnemies = 0;
    this.gameTime = 0;
    
      
    // Player
    this.player = null;
    this.robotTypes = {
      assault: { 
        color: '#4CAF50', 
        speed: 220, 
        health: 100, 
        fireRate: 0.2,
        bulletSpeed: 500,
        bulletDamage: 20
      },
      tank: { 
        color: '#FFC107', 
        speed: 160, 
        health: 150, 
        fireRate: 0.4,
        bulletSpeed: 400,
        bulletDamage: 30
      },
      stealth: { 
        color: '#2196F3', 
        speed: 250, 
        health: 75, 
        fireRate: 0.15,
        bulletSpeed: 550,
        bulletDamage: 15
      }
    };
    
    // Entities
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.powerups = [];
    this.particles = [];
    
    // Camera
    this.camera = { x: 0, y: 0 };
    
    // Input
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false };
    
    // Debug mode
    this.debugMode = false;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load assets
    this.loadAssets();

    // Sound settings
    this.musicEnabled = true;
    this.sfxEnabled = true;
    
    setTimeout(() => {
      if (this.musicEnabled && this.sounds.bgm) {
        this.playSound('bgm');
      }
    }, 1000);

    // Update UI to match initial state
    setTimeout(() => {
      this.updateMusicButtonUI();
      this.updateSFXButtonUI();
    }, 100);

    // Start the game loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  initializeAudio() {
    // Create a function to handle audio unlocking
    const unlockAudio = () => {
      if (this.audioInitialized) return;
      
      console.log("Initializing audio...");
      
      // Try to play and immediately pause all sounds to "unlock" them
      Object.values(this.sounds).forEach(sound => {
        sound.play()
          .then(() => {
            sound.pause();
            sound.currentTime = 0;
          })
          .catch(e => console.log("Could not initialize audio:", e));
      });
      
      this.audioInitialized = true;
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  
    // Execute immediately to try initialization
    unlockAudio();
    
    // Also add event listeners for later user interaction
    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
  }

  // playSound(name) {
  //   if (!this.sounds[name]) return;
    
  //   // Reset the sound if it's already playing
  //   const sound = this.sounds[name];
  //   sound.currentTime = 0;
    
  //   // Play with proper error handling
  //   sound.play().catch(error => {
  //     // If sound fails, just log it and continue (don't break the game)
  //     console.log(`Error playing ${name} sound:`, error);
  //   });
  // }

  // Add this method for saving sound preferences
  saveSoundPreferences() {
    localStorage.setItem('roboRebellion_musicEnabled', this.musicEnabled);
    localStorage.setItem('roboRebellion_sfxEnabled', this.sfxEnabled);
  }

  // Add this method for loading sound preferences
  loadSoundPreferences() {
    const musicPref = localStorage.getItem('roboRebellion_musicEnabled');
    const sfxPref = localStorage.getItem('roboRebellion_sfxEnabled');
    
    if (musicPref !== null) {
      this.musicEnabled = musicPref === 'true';
      this.updateMusicButtonUI();
    }
    
    if (sfxPref !== null) {
      this.sfxEnabled = sfxPref === 'true';
      this.updateSFXButtonUI();
    }
  }
  
  setupEventListeners() {
    // Keyboard events
    
    
    window.addEventListener('keyup', e => {
      this.keys[e.key] = false;
    });
    
    // Mouse events
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mousedown', e => {
      if (e.button === 0) this.mouse.isDown = true;
    });
    
    this.canvas.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouse.isDown = false;
    });
    
    // Prevent context menu
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    // Handle clicks on character selection
    document.querySelectorAll('.character').forEach(char => {
      char.addEventListener('click', () => {
        document.querySelectorAll('.character').forEach(c => c.classList.remove('selected'));
        char.classList.add('selected');
      });
    });
    
    // Start button
    document.getElementById('start-game').addEventListener('click', () => {
      const selectedChar = document.querySelector('.character.selected');
      const robotType = selectedChar ? selectedChar.dataset.type : 'assault';
      this.startGame(robotType);
    });
    
    // Restart button
    document.getElementById('restart-game').addEventListener('click', () => {
      document.getElementById('game-over').classList.add('hidden');
      document.getElementById('start-screen').classList.remove('hidden');
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });

    // Enhanced keyboard events for pause
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      
      // Toggle debug mode with F1
      if (e.key === 'F1') {
        this.debugMode = !this.debugMode;
        e.preventDefault();
      }
      
      // Toggle pause with Escape
      if (e.key === 'Escape' && (this.state === 'playing' || this.state === 'paused')) {
        this.togglePause();
      }
      
      // Dash with space bar
      if (e.key === ' ' && this.state === 'playing' && this.player && !this.player.dashing) {
        this.player.dash();
      }
    });
    
    // Add these event listeners for the pause button and pause screen
    document.getElementById('pause-button').addEventListener('click', () => {
      if (this.state === 'playing') {
        this.togglePause();
      }
    });
    
    document.getElementById('resume-game').addEventListener('click', () => {
      if (this.state === 'paused') {
        this.togglePause();
      }
    });
    
    document.getElementById('restart-from-pause').addEventListener('click', () => {
      if (this.state === 'paused') {
        this.state = 'menu';
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');

        if (this.musicEnabled && this.sounds.bgm) {
          this.sounds.bgm.currentTime = 0;
          this.playSound('bgm');
        }
      }
    });

    // Volume control
    document.getElementById('toggle-mute').addEventListener('click', () => {
      if (this.sounds.bgm) {
        if (this.sounds.bgm.volume > 0) {
          this.sounds.bgm.volume = 0;
          document.getElementById('toggle-mute').textContent = '🔇';
        } else {
          this.sounds.bgm.volume = 0.3;
          document.getElementById('toggle-mute').textContent = '🔊';
        }
      }
    });

    // Add sound control listeners
    document.getElementById('toggle-music').addEventListener('click', () => {
      this.toggleMusic();
    });
    
    document.getElementById('toggle-sfx').addEventListener('click', () => {
      this.toggleSFX();
    });
  }

  togglePause() {
    if (this.state === 'playing') {
      // Pause the game
      this.state = 'paused';
      document.getElementById('pause-screen').classList.remove('hidden');
      console.log("Game paused");

      // pause bgm
      if (this.sounds.bgm) {
        this.sounds.bgm.pause();
      }
      console.log("Game paused");
    } else if (this.state === 'paused') {
      // Resume the game
      this.state = 'playing';
      document.getElementById('pause-screen').classList.add('hidden');
      this.lastTime = performance.now(); // Reset the timer to prevent huge jumps
      console.log("Game resumed");

      // Resume BGM
    if (this.sounds.bgm) {
      this.sounds.bgm.play().catch(e => console.log("Error resuming BGM:", e));
    }
    }
    // if (this.state === 'playing') {
    //   this.state = 'paused';
    //   document.getElementById('pause-screen').classList.remove('hidden');
    //   // Optionally pause any audio
    //   // Object.values(this.sounds).forEach(sound => sound.pause());
    // } else if (this.state === 'paused') {
    //   this.state = 'playing';
    //   document.getElementById('pause-screen').classList.add('hidden');
    //   // Continue game loop
    //   this.lastTime = performance.now();
    // }
  }
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    
    if (this.musicEnabled) {
      // Resume music if game is playing
      if (this.state === 'playing' && this.sounds.bgm) {
        this.sounds.bgm.play().catch(e => console.log("Error playing BGM:", e));
      }
    } else {
      // Pause music
      if (this.sounds.bgm) {
        this.sounds.bgm.pause();
      }
    }
    
    // Update UI
    this.updateMusicButtonUI();
    
    // Save preference
    this.saveSoundPreferences();
  }
  
  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    
    // Update UI
    this.updateSFXButtonUI();
    
    // Save preference
    this.saveSoundPreferences();
  }
  
  updateMusicButtonUI() {
    const musicBtn = document.getElementById('toggle-music');
    if (musicBtn) {
      if (this.musicEnabled) {
        musicBtn.textContent = '🎵';
        musicBtn.classList.remove('muted');
      } else {
        musicBtn.textContent = '🎵';
        musicBtn.classList.add('muted');
      }
    }
  }
  
  updateSFXButtonUI() {
    const sfxBtn = document.getElementById('toggle-sfx');
    if (sfxBtn) {
      if (this.sfxEnabled) {
        sfxBtn.textContent = '🔊';
        sfxBtn.classList.remove('muted');
      } else {
        sfxBtn.textContent = '🔊';
        sfxBtn.classList.add('muted');
      }
    }
  }
  
  // Update your playSound method to respect preferences
  playSound(name) {
    // Check if the sound exists first
    if (!this.sounds[name]) {
      console.warn(`Sound "${name}" not found`);
      return;
    }
    
    // Don't play SFX if disabled (except BGM)
    if (!this.sfxEnabled && name !== 'bgm') return;
    
    // Don't play BGM if music is disabled
    if (!this.musicEnabled && name === 'bgm') return;
    
    // Get the sound object
    const sound = this.sounds[name];
    
    // Set looping for background music
    if (name === 'bgm') {
      sound.loop = true;
    }
    
    // Reset the sound if it's already playing
    sound.currentTime = 0;
    
    // Play with proper error handling
    sound.play().catch(error => {
      console.log(`Error playing ${name} sound:`, error);
      
      // Try alternative approach for mobile browsers
      if (name === 'bgm' && error.name === 'NotAllowedError') {
        console.log('Browser blocked autoplay. Waiting for user interaction.');
        
        // Add one-time listener to enable audio on next interaction
        const enableAudio = () => {
          sound.play().catch(e => console.log('Still unable to play audio:', e));
          document.removeEventListener('click', enableAudio);
        };
        document.addEventListener('click', enableAudio);
      }
    });
  }
  
  loadAssets() {
    
    this.sounds = {
      shoot: new Audio('assets/sounds/shoot.mp3'),
      enemyShoot: new Audio('assets/sounds/enemyShoot.mp3'),
      explosion: new Audio('assets/sounds/explosion.mp3'),
      powerup: new Audio('assets/sounds/powerup.mp3'),
      hit: new Audio('assets/sounds/hit.mp3'),
      hit2: new Audio('assets/sounds/hit2.mp3'),
      hit3: new Audio('assets/sounds/hit3.mp3'),
      gameOver: new Audio('assets/sounds/gameover.mp3'),
      bgm: new Audio('assets/sounds/bgm.mp3')
    };
    
    // For performance, preload and configure sounds
    Object.entries(this.sounds).forEach(([name, sound]) => {
    sound.volume = 0.3;
    sound.load();

    sound.addEventListener('error', (e) => {
      console.error(`Error loading sound ${name}:`, e);
    });
  });

    // Load sounds
    this.initializeAudio();

    this.loadSoundPreferences();
  }

  
  
  gameLoop(timestamp) {
    // Calculate delta time (capped at 100ms to prevent huge jumps)
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    
    if (this.state === 'playing') {
      this.update(deltaTime);
    }
    
    this.render();
    
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  updatePlayerTrail() {
    if (this.player) {
      // Add current position to trail
      this.player.trail.push({
        x: this.player.x + this.player.width/2,
        y: this.player.y + this.player.height/2
      });
      
      // Limit trail length
      if (this.player.trail.length > this.player.trailMax) {
        this.player.trail.shift();
      }
    }
  }
  
  // Render the trail
  renderPlayerTrail() {
    if (this.player && this.player.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.trail[0].x, this.player.trail[0].y);
      
      for (let i = 1; i < this.player.trail.length; i++) {
        this.ctx.lineTo(this.player.trail[i].x, this.player.trail[i].y);
      }
      
      this.ctx.strokeStyle = this.player.color + '80'; // Add transparency
      this.ctx.lineWidth = 5 * (this.player.dashing ? 2 : 1); // Thicker during dash
      this.ctx.stroke();
    }
  }
  
  update(deltaTime) {
    this.gameTime += deltaTime;
    
    // Update player
    if (this.player) {
      this.updatePlayer(deltaTime);

      this.updatePlayerTrail();
      
      // Update camera to center on player
      this.camera.x = this.player.x - this.canvas.width / 2 + this.player.width / 2;
      this.camera.y = this.player.y - this.canvas.height / 2 + this.player.height / 2;
    }
    
    // Update bullets
    this.updateBullets(deltaTime);
    
    // Update enemies
    this.updateEnemies(deltaTime);
    
    // Update explosions
    this.updateExplosions(deltaTime);

    // Update particles
    this.updateParticles(deltaTime);
    
    // Update powerups
    this.updatePowerups(deltaTime);
    
    // Check for wave completion
    if (this.enemies.length === 0 && this.waveEnemies <= 0) {
      this.startNextWave();
    }
  }
  
  updatePlayer(deltaTime) {
    // Handle movement input
    let moveX = 0;
    let moveY = 0;
    
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'])  moveY -= 1;
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) moveY += 1;
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveX -= 1;
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveX += 1;
    
    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      const length = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= length;
      moveY /= length;
    }
    
    // Apply dash momentum if dashing
    if (this.player.dashing) {
      this.player.dashTime -= deltaTime;
      
      if (this.player.dashTime <= 0) {
        this.player.dashing = false;
        this.player.invulnerable = false;
      } else {
        // Boost movement during dash
        moveX *= 3;
        moveY *= 3;
      }
    }
    
    // Calculate velocities based on movement input
    const targetVelocityX = moveX * this.player.speed;
    const targetVelocityY = moveY * this.player.speed;
    
    // Apply smooth acceleration/deceleration
    const smoothing = this.player.dashing ? 0.8 : 0.3;
    this.player.velocityX += (targetVelocityX - this.player.velocityX) * smoothing;
    this.player.velocityY += (targetVelocityY - this.player.velocityY) * smoothing;
    
    // Apply movement
    this.player.x += this.player.velocityX * deltaTime;
    this.player.y += this.player.velocityY * deltaTime;
    
    // Calculate current speed (magnitude of velocity)
    this.player.currentSpeed = Math.sqrt(
      this.player.velocityX * this.player.velocityX + 
      this.player.velocityY * this.player.velocityY
    );
    
    // Keep player within world bounds (larger area for gameplay)
    const worldSize = 2000;
    this.player.x = Math.max(0, Math.min(worldSize, this.player.x));
    this.player.y = Math.max(0, Math.min(worldSize, this.player.y));
    
    // Handle shooting
    this.player.fireTimer -= deltaTime;
    
    if (this.mouse.isDown && this.player.fireTimer <= 0) {
      this.playerShoot();
      this.player.fireTimer = this.player.fireRate;
    }
    
    // Update dash cooldown
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown -= deltaTime;
    }
  }
  
  playerShoot() {
    // Calculate direction from player to mouse
    const mouseWorldX = this.mouse.x + this.camera.x;
    const mouseWorldY = this.mouse.y + this.camera.y;
    
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    
    const angle = Math.atan2(
      mouseWorldY - playerCenterY,
      mouseWorldX - playerCenterX
    );
    
    // Create bullet
    this.bullets.push({
      x: playerCenterX,
      y: playerCenterY,
      vx: Math.cos(angle) * this.player.bulletSpeed,
      vy: Math.sin(angle) * this.player.bulletSpeed,
      width: 8,
      height: 8,
      color: this.player.color,
      damage: this.player.bulletDamage,
      fromPlayer: true,
      lifetime: 2.0
    });
    
    // Play sound
    this.playSound('shoot');
    
    // Add muzzle flash effect
    this.explosions.push({
      x: playerCenterX + Math.cos(angle) * 20,
      y: playerCenterY + Math.sin(angle) * 20,
      radius: 10,
      color: '#FFFF00',
      alpha: 1.0,
      lifetime: 0.1
    });
  }
  
  updateBullets(deltaTime) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      // Update position
      bullet.x += bullet.vx * deltaTime;
      bullet.y += bullet.vy * deltaTime;
      
      // Update lifetime
      bullet.lifetime -= deltaTime;
      
      // Remove expired bullets
      if (bullet.lifetime <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }
      
      // Check for collisions
      if (bullet.fromPlayer) {
        // Check against enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          
          if (this.checkCollision(bullet, enemy)) {
            // Damage enemy
            enemy.health -= bullet.damage;
            
            // Create hit effect
            this.explosions.push({
              x: bullet.x,
              y: bullet.y,
              radius: 15,
              color: '#FFFFFF',
              alpha: 1.0,
              lifetime: 0.2
            });
            
            // Play hit sound
            this.playSound('hit');

            // Remove bullet
            this.bullets.splice(i, 1);
            
            // Check if enemy is defeated
            if (enemy.health <= 0) {
              // Create explosion
              this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
              
              // Add score
              this.score += enemy.points;
              
              // Chance to drop powerup
              if (Math.random() < 0.2) {
                this.spawnPowerup(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
              }
              
              // Remove enemy
              this.enemies.splice(j, 1);
            }
            
            break;
          }
        }
      } else {
        // Check against player
        if (this.player && !this.player.invulnerable && this.checkCollision(bullet, this.player)) {
          // Damage player
          this.player.health -= bullet.damage;
          
          // Update health bar
          this.updateHealthBar();
          
          // Create hit effect
          this.explosions.push({
            x: bullet.x,
            y: bullet.y,
            radius: 15,
            color: '#FF0000',
            alpha: 1.0,
            lifetime: 0.2
          });
          
          // Apply screen shake
          this.screenShake = 0.2;

          this.playSound('hit2');
          
          // Remove bullet
          this.bullets.splice(i, 1);
          
          // Check for game over
          if (this.player.health <= 0) {
            this.gameOver();
          }
        }
      }
    }
  }
  
  updateEnemies(deltaTime) {
    // Spawn new enemies
    if (this.waveEnemies > 0 && this.enemies.length < 5 + this.wave) {
      this.spawnEnemy();
      this.waveEnemies--;
    }
    
    // Update existing enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // AI based on enemy type
      switch (enemy.type) {
        case 'chaser':
          this.updateChaserEnemy(enemy, deltaTime);
          break;
        case 'shooter':
          this.updateShooterEnemy(enemy, deltaTime);
          break;
        case 'tank':
          this.updateTankEnemy(enemy, deltaTime);
          break;
      }
      
      // Check collision with player
      if (this.player && !this.player.invulnerable && this.checkCollision(enemy, this.player)) {
        // Damage player
        this.player.health -= enemy.contactDamage;

        // Play player hit sound
        this.playSound('hit3');
        
        // Update health bar
        this.updateHealthBar();
        
        // Make player temporarily invulnerable
        this.player.invulnerable = true;
        setTimeout(() => { this.player.invulnerable = false; }, 500);
        
        // Apply knockback to player
        const angle = Math.atan2(
          this.player.y - enemy.y,
          this.player.x - enemy.x
        );
        this.player.x += Math.cos(angle) * 30;
        this.player.y += Math.sin(angle) * 30;
        
        // Check for game over
        if (this.player.health <= 0) {
          this.gameOver();
        }
      }
    }
  }
  
  updateChaserEnemy(enemy, deltaTime) {
    // Move directly toward player
    if (!this.player) return;
    
    const angle = Math.atan2(
      this.player.y - enemy.y,
      this.player.x - enemy.x
    );
    
    enemy.x += Math.cos(angle) * enemy.speed * deltaTime;
    enemy.y += Math.sin(angle) * enemy.speed * deltaTime;
  }
  
  updateShooterEnemy(enemy, deltaTime) {
    // Keep distance and shoot at player
    if (!this.player) return;
    
    const dx = this.player.x - enemy.x;
    const dy = this.player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Move away if too close, toward if too far
    const idealDistance = 300;
    if (distance < idealDistance - 50) {
      // Move away
      const angle = Math.atan2(dy, dx);
      enemy.x -= Math.cos(angle) * enemy.speed * deltaTime;
      enemy.y -= Math.sin(angle) * enemy.speed * deltaTime;
    } else if (distance > idealDistance + 50) {
      // Move closer
      const angle = Math.atan2(dy, dx);
      enemy.x += Math.cos(angle) * enemy.speed * deltaTime;
      enemy.y += Math.sin(angle) * enemy.speed * deltaTime;
    }
    
    // Shoot at player
    enemy.fireTimer -= deltaTime;
    if (enemy.fireTimer <= 0) {
      this.enemyShoot(enemy);
      enemy.fireTimer = enemy.fireRate;
    }
  }
  
  updateTankEnemy(enemy, deltaTime) {
    // Slow but powerful, moves toward player
    if (!this.player) return;
    
    const angle = Math.atan2(
      this.player.y - enemy.y,
      this.player.x - enemy.x
    );
    
    enemy.x += Math.cos(angle) * enemy.speed * deltaTime;
    enemy.y += Math.sin(angle) * enemy.speed * deltaTime;
    
    // Shoot occasionally
    enemy.fireTimer -= deltaTime;
    if (enemy.fireTimer <= 0) {
      // Shoot in 3 directions
      for (let i = -1; i <= 1; i++) {
        const spreadAngle = angle + i * 0.3;
        this.enemyShoot(enemy, spreadAngle);
      }
      enemy.fireTimer = enemy.fireRate;
    }
  }
  
  enemyShoot(enemy, angle) {
    if (!this.player) return;
    
    // Default to angle toward player if not specified
    if (angle === undefined) {
      angle = Math.atan2(
        this.player.y - enemy.y,
        this.player.x - enemy.x
      );
    }
    
    // Create bullet
    this.bullets.push({
      x: enemy.x + enemy.width / 2,
      y: enemy.y + enemy.height / 2,
      vx: Math.cos(angle) * enemy.bulletSpeed,
      vy: Math.sin(angle) * enemy.bulletSpeed,
      width: 6,
      height: 6,
      color: enemy.bulletColor,
      damage: enemy.bulletDamage,
      fromPlayer: false,
      lifetime: 1.5
    });

    // play sound
    this.playSound('enemyShoot');
  }
  
  updateExplosions(deltaTime) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      
      // Update lifetime
      explosion.lifetime -= deltaTime;
      explosion.alpha = explosion.lifetime / 0.5; // Fade out
      
      // Add this code to move particles:
      if (explosion.vx !== undefined) {
        explosion.x += explosion.vx * deltaTime;
        explosion.y += explosion.vy * deltaTime;
      }
      
      // Remove expired explosions
      if (explosion.lifetime <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }
  
  updatePowerups(deltaTime) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      
      // Update lifetime if temporary
      if (powerup.lifetime) {
        powerup.lifetime -= deltaTime;
        if (powerup.lifetime <= 0) {
          this.powerups.splice(i, 1);
          continue;
        }
      }
      
      // Check collision with player
      if (this.player && this.checkCollision(powerup, this.player)) {
        // Apply powerup
        switch (powerup.type) {
          case 'health':
            this.player.health = Math.min(this.player.health + 30, this.player.maxHealth);
            this.updateHealthBar();
            break;
          case 'rapidFire':
            this.player.fireRate *= 0.5;
            // Temporary boost
            setTimeout(() => { this.player.fireRate *= 2; }, 10000);
            break;
          case 'damage':
            this.player.bulletDamage *= 1.5;
            // Temporary boost
            setTimeout(() => { this.player.bulletDamage /= 1.5; }, 10000);
            break;
        }
        
        // Play sound
        this.playSound('powerup');
        
        // Show message
        this.showMessage(`${powerup.name} acquired!`, 2000);
        
        // Remove powerup
        this.powerups.splice(i, 1);
      }
    }
  }
  
  spawnEnemy() {
    // Determine spawn position (outside screen)
    let x, y;
    const side = Math.floor(Math.random() * 4);
    
    switch (side) {
      case 0: // Top
        x = Math.random() * 2000;
        y = -50;
        break;
      case 1: // Right
        x = 2050;
        y = Math.random() * 2000;
        break;
      case 2: // Bottom
        x = Math.random() * 2000;
        y = 2050;
        break;
      case 3: // Left
        x = -50;
        y = Math.random() * 2000;
        break;
    }
    
    // Enemy type weights change based on wave
    let enemyType;
    const rand = Math.random();
    
    if (this.wave < 3) {
      // Early waves: mostly chasers
      enemyType = rand < 0.8 ? 'chaser' : 'shooter';
    } else if (this.wave < 6) {
      // Mid waves: mix of chasers and shooters
      enemyType = rand < 0.5 ? 'chaser' : (rand < 0.9 ? 'shooter' : 'tank');
    } else {
      // Later waves: all types, more tanks
      enemyType = rand < 0.4 ? 'chaser' : (rand < 0.7 ? 'shooter' : 'tank');
    }
    
    // Enemy stats based on type and wave
    const enemyStats = {
      chaser: {
        width: 30,
        height: 30,
        health: 30 + this.wave * 5,
        speed: 150,
        color: '#FF5722',
        contactDamage: 10,
        points: 100
      },
      shooter: {
        width: 25,
        height: 25,
        health: 20 + this.wave * 3,
        speed: 100,
        color: '#673AB7',
        contactDamage: 5,
        fireRate: 1.5,
        fireTimer: 0,
        bulletSpeed: 300,
        bulletDamage: 8,
        bulletColor: '#9C27B0',
        points: 150
      },
      tank: {
        width: 40,
        height: 40,
        health: 60 + this.wave * 10,
        speed: 75,
        color: '#795548',
        contactDamage: 15,
        fireRate: 3,
        fireTimer: 0,
        bulletSpeed: 200,
        bulletDamage: 12,
        bulletColor: '#8D6E63',
        points: 250
      }
    };
    
    // Create and add enemy
    this.enemies.push({
      ...enemyStats[enemyType],
      x: x,
      y: y,
      type: enemyType
    });
  }
  
  spawnPowerup(x, y) {
    // Determine powerup type
    const rand = Math.random();
    let type, name, color;
    
    if (rand < 0.5) {
      type = 'health';
      name = 'Health Pack';
      color = '#4CAF50';
    } else if (rand < 0.8) {
      type = 'rapidFire';
      name = 'Rapid Fire';
      color = '#FFEB3B';
    } else {
      type = 'damage';
      name = 'Damage Boost';
      color = '#F44336';
    }
    
    // Add powerup
    this.powerups.push({
      x: x,
      y: y,
      width: 20,
      height: 20,
      type: type,
      name: name,
      color: color,
      lifetime: 15 // Disappears after 15 seconds
    });
  }
  
  createExplosion(x, y) {
    // Add explosion effect
    this.explosions.push({
      x: x,
      y: y,
      radius: 30,
      color: '#FF9800',
      alpha: 1.0,
      lifetime: 0.5
    });
    
    // Play sound
    this.playSound('explosion');
    
    // Add particle effects
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      
      this.explosions.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5 + Math.random() * 5,
        color: '#FFCC80',
        alpha: 1.0,
        lifetime: 0.3 + Math.random() * 0.5
      });
    }
  }

  createParticles(x, y, color, count, speed, size, lifetime) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.5 + Math.random() * 0.5);
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: size * (0.5 + Math.random() * 0.5),
        color: color,
        alpha: 1.0,
        lifetime: lifetime * (0.8 + Math.random() * 0.4)
      });
    }
  }
  
  startGame(robotType) {
    // Hide start screen, show HUD
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    
    // Set game state
    this.state = 'playing';
    this.score = 0;
    this.wave = 1;
    this.gameTime = 0;
    
    // Clear entities
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.powerups = [];
    this.particles = [];
    
    // Create player
    const robotTemplate = this.robotTypes[robotType];
    this.player = {
      x: 1000,
      y: 1000,
      width: 40,
      height: 40,
      type: robotType,
      color: robotTemplate.color,
      speed: robotTemplate.speed,
      health: robotTemplate.health,
      maxHealth: robotTemplate.health,
      fireRate: robotTemplate.fireRate,
      fireTimer: 0,
      bulletSpeed: robotTemplate.bulletSpeed,
      bulletDamage: robotTemplate.bulletDamage,
      dashCooldown: 0,
      dashTime: 0,
      dashing: false,
      invulnerable: false,
      trail: [],
      trailMax: 10,
      trailColor: robotTemplate.color,
      faceMouseWhileMoving: true,
      velocityX: 0,
      velocityY: 0,
      currentSpeed: 0
    };
    
    this.player.dash = () => { // Use arrow function to keep 'this' context
      if (this.player.dashCooldown <= 0) {
        // Set dashing state
        this.player.dashing = true;
        this.player.invulnerable = true;
        this.player.dashTime = 0.2;
        this.player.dashCooldown = 3;
        
        // Add dash effect - now using main game's explosions array
        for (let i = 0; i < 10; i++) {
          this.explosions.push({
            x: this.player.x + this.player.width/2,
            y: this.player.y + this.player.height/2,
            radius: 5,
            color: '#FFFFFF',
            alpha: 0.7,
            lifetime: 0.2
          });
        }
      }
    };
    
    // Set up first wave
    this.waveEnemies = 5;


    
    // Update UI
    this.updateHealthBar();
    document.getElementById('score').textContent = `Score: ${this.score}`;
    
    // Show welcome message
    this.showMessage(`Wave ${this.wave} - Get Ready!`, 2000);

     // Play music if enabled
    if (this.musicEnabled && this.sounds.bgm) {
      this.sounds.bgm.currentTime = 0;
      this.playSound('bgm');
    }
    
    if (this.sfxEnabled) {
      const sfxBtn = document.getElementById('toggle-sfx');
      if (sfxBtn) sfxBtn.classList.remove('muted');
    }

    // play musig
    // this.sounds.bgm.currentTime = 0;s

    // this.player.game = this;
  }
  
  startNextWave() {
    this.wave++;
    this.waveEnemies = 5 + this.wave * 2;
    
    // Show message
    this.showMessage(`Wave ${this.wave} - Incoming!`, 2000);
    
    // Drop a powerup for the player
    this.spawnPowerup(
      this.player.x + Math.random() * 200 - 100,
      this.player.y + Math.random() * 200 - 100
    );
  }
  
  gameOver() {
    // Set state
    this.state = 'gameover';

    // stop bgm
    if (this.sounds.bgm) {
      this.sounds.bgm.pause();
      this.sounds.bgm.currentTime = 0;
    }
    
    // Play game over sound
    this.playSound('gameOver');
    
    // Hide HUD, show game over screen
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('rooms-cleared').textContent = this.wave - 1;
    document.getElementById('game-over').classList.remove('hidden');
  }

  applyDamageEffect() {
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  // Enhanced screen shake
  applyScreenShake() {
    if (this.screenShake > 0) {
      const intensity = this.screenShake * 10;
      const shakeX = (Math.random() - 0.5) * intensity;
      const shakeY = (Math.random() - 0.5) * intensity;
      
      this.ctx.translate(shakeX, shakeY);
    }
  }
  
  render() {
    // Calculate a delta time for animations
    const renderDelta = 1/60;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw game world - pass the renderDelta
    if (this.state === 'playing' || this.state === 'paused') {
      this.renderGameWorld(renderDelta);
    }
    
    // Draw UI overlay for paused state
    if (this.state === 'paused') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '24px Arial';
      // this.ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    // Draw debug info
    if (this.debugMode) {
      this.renderDebugInfo();
    }
  }
  
  renderGameWorld(deltaTime) {
    // Apply screen shake effect
    if (this.screenShake > 0) {
      this.applyScreenShake();
      this.screenShake -= 0.016;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // Apply camera transformation
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Draw grid (world background)
    this.renderGrid();
    
    // Draw game boundary
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 5;
    this.ctx.strokeRect(0, 0, 2000, 2000);

    // Add player lighting effects if player exists
    if (this.player) {
      // Player lighting (should be before player to appear under it)
      this.renderLighting();
      
      // Player trail
      if (this.player.trail.length > 1) {
        this.renderPlayerTrail();
      }
      
      // The player itself (using dedicated method)
      this.renderPlayer(deltaTime);
    }
    
    // Draw powerups
    this.powerups.forEach(powerup => {
      this.ctx.fillStyle = powerup.color;
      this.ctx.beginPath();
      this.ctx.arc(
        powerup.x,
        powerup.y,
        15,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Draw icon based on type
      this.ctx.fillStyle = '#FFFFFF';
      switch (powerup.type) {
        case 'health':
          // Draw plus sign
          this.ctx.fillRect(powerup.x - 8, powerup.y - 2, 16, 4);
          this.ctx.fillRect(powerup.x - 2, powerup.y - 8, 4, 16);
          break;
        case 'rapidFire':
          // Draw lightning bolt
          this.ctx.beginPath();
          this.ctx.moveTo(powerup.x - 5, powerup.y - 8);
          this.ctx.lineTo(powerup.x + 2, powerup.y - 1);
          this.ctx.lineTo(powerup.x - 2, powerup.y);
          this.ctx.lineTo(powerup.x + 5, powerup.y + 8);
          this.ctx.fill();
          break;
        case 'damage':
          // Draw star
          this.ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            const angle = Math.PI / 2 + i * Math.PI * 2 / 5;
            const innerAngle = angle + Math.PI / 5;
            this.ctx.lineTo(powerup.x + Math.cos(angle) * 8, powerup.y + Math.sin(angle) * 8);
            this.ctx.lineTo(powerup.x + Math.cos(innerAngle) * 4, powerup.y + Math.sin(innerAngle) * 4);
          }
          this.ctx.fill();
          break;
      }
    });
    
    // Draw enemies using enhanced shapes
  this.enemies.forEach(enemy => {
    this.renderEnemy(enemy);
    
    // Draw health bar above enemy
    const healthPercentage = enemy.health / (enemy.type === 'tank' ? 60 + this.wave * 10 : (enemy.type === 'chaser' ? 30 + this.wave * 5 : 20 + this.wave * 3));
    this.ctx.fillStyle = '#444444';
    this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercentage, 5);
  });
  
  // Draw particles
  if (this.particles) {
    this.particles.forEach(particle => {
      this.ctx.globalAlpha = particle.alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    });
  }
  
  // Draw bullets
  this.bullets.forEach(bullet => {
    this.ctx.fillStyle = bullet.color;
    if (bullet.fromPlayer) {
      // Player bullets are circular with glow
      this.ctx.shadowColor = bullet.color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.width/2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    } else {
      // Enemy bullets are diamonds
      this.ctx.save();
      this.ctx.translate(bullet.x, bullet.y);
      this.ctx.rotate(Math.PI / 4);
      this.ctx.fillRect(-bullet.width/2, -bullet.height/2, bullet.width, bullet.height);
      this.ctx.restore();
    }
  });
  
  
  // 10. Explosions
  this.explosions.forEach(explosion => {
    this.ctx.globalAlpha = explosion.alpha;
    this.ctx.fillStyle = explosion.color;
    
    if (explosion.vx !== undefined) {
      // Don't move explosion particles here - that belongs in updateExplosions
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Static explosion with glow
      this.ctx.shadowColor = explosion.color;
      this.ctx.shadowBlur = 15;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
    
    this.ctx.globalAlpha = 1.0;
  });

   
  // Restore original transformation
  this.ctx.restore();
  
  // Draw wave indicator
  this.ctx.fillStyle = '#FFFFFF';
  this.ctx.font = '24px Arial';
  this.ctx.textAlign = 'left';
  this.ctx.fillText(`Wave: ${this.wave}`, 20, this.canvas.height - 20);
  
  // Draw score
  this.ctx.textAlign = 'right';
  this.ctx.fillText(`Score: ${this.score}`, this.canvas.width - 20, this.canvas.height - 20);
  
  }

  renderEnemy(enemy) {
    this.ctx.fillStyle = enemy.color;
    
    switch(enemy.type) {
      case 'chaser':
        // Triangle shape
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
        this.ctx.lineTo(enemy.x, enemy.y + enemy.height);
        this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
        this.ctx.closePath();
        this.ctx.fill();
        break;
        
      case 'shooter':
        // Diamond shape
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
        this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height/2);
        this.ctx.lineTo(enemy.x + enemy.width/2, enemy.y + enemy.height);
        this.ctx.lineTo(enemy.x, enemy.y + enemy.height/2);
        this.ctx.closePath();
        this.ctx.fill();
        break;
        
      case 'tank':
        // Hexagon shape
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = Math.PI / 3 * i;
          const x = enemy.x + enemy.width/2 + Math.cos(angle) * enemy.width/2;
          const y = enemy.y + enemy.height/2 + Math.sin(angle) * enemy.height/2;
          
          if (i === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        break;
    }
  }

  // renderPlayer(){

  
  //   if (!this.player) return;
  
  //   // Flash when invulnerable
  //   if (this.player.invulnerable && Math.floor(this.gameTime * 10) % 2 === 0) {
  //     this.ctx.globalAlpha = 0.5;
  //   }
    
  //   const x = this.player.x;
  //   const y = this.player.y;
  //   const w = this.player.width;
  //   const h = this.player.height;
  //   const robotType = this.player.type || 'assault';
    
  //   // Calculate angle to face mouse
  //   const mouseWorldX = this.mouse.x + this.camera.x;
  //   const mouseWorldY = this.mouse.y + this.camera.y;
  //   const angle = Math.atan2(
  //     mouseWorldY - (y + h/2),
  //     mouseWorldX - (x + w/2)
  //   );
    
  //   // Save context for rotation
  //   this.ctx.save();
  //   this.ctx.translate(x + w/2, y + h/2);
  //   this.ctx.rotate(angle);
    
  //   // Base color from robot type
  //   const color = this.player.color;
    
  //   // Draw robot body based on type
  //   if (robotType === 'assault') {
  //     // Assault robot - sleek, fast-looking design
      
  //     // Main body (triangular)
  //     this.ctx.fillStyle = color;
  //     this.ctx.beginPath();
  //     this.ctx.moveTo(w/2, -h/2);
  //     this.ctx.lineTo(-w/2, h/3);
  //     this.ctx.lineTo(w/2, h/2);
  //     this.ctx.closePath();
  //     this.ctx.fill();
      
  //     // Secondary color accent
  //     this.ctx.fillStyle = this.shadeColor(color, -30);
  //     this.ctx.beginPath();
  //     this.ctx.moveTo(w/2, -h/4);
  //     this.ctx.lineTo(-w/4, h/4);
  //     this.ctx.lineTo(w/2, h/4);
  //     this.ctx.closePath();
  //     this.ctx.fill();
      
  //     // Robot eye/visor
  //     this.ctx.fillStyle = '#FFFFFF';
  //     this.ctx.beginPath();
  //     this.ctx.arc(w/4, -h/8, h/10, 0, Math.PI * 2);
  //     this.ctx.fill();
      
  //     // Glowing eye effect
  //     this.ctx.fillStyle = '#88CCFF';
  //     this.ctx.beginPath();
  //     this.ctx.arc(w/4, -h/8, h/15, 0, Math.PI * 2);
  //     this.ctx.fill();
      
  //   } else if (robotType === 'tank') {
  //     // Tank robot - bulky, heavy design
      
  //     // Main body (hexagon)
  //     this.ctx.fillStyle = color;
  //     this.ctx.beginPath();
  //     for (let i = 0; i < 6; i++) {
  //       const angle = Math.PI / 3 * i;
  //       const xPos = Math.cos(angle) * w/2;
  //       const yPos = Math.sin(angle) * h/2;
  //       if (i === 0) this.ctx.moveTo(xPos, yPos);
  //       else this.ctx.lineTo(xPos, yPos);
  //     }
  //     this.ctx.closePath();
  //     this.ctx.fill();
      
  //     // Armor plates
  //     this.ctx.fillStyle = this.shadeColor(color, -30);
  //     this.ctx.beginPath();
  //     this.ctx.fillRect(-w/4, -h/4, w/2, h/2);
      
  //     // Dual robot eyes
  //     this.ctx.fillStyle = '#FF3300';
  //     this.ctx.beginPath();
  //     this.ctx.arc(w/6, -h/6, h/12, 0, Math.PI * 2);
  //     this.ctx.fill();
  //     this.ctx.beginPath();
  //     this.ctx.arc(-w/6, -h/6, h/12, 0, Math.PI * 2);
  //     this.ctx.fill();
      
  //   } else {
  //     // Stealth robot - angular, sleek design
      
  //     // Main body (diamond)
  //     this.ctx.fillStyle = color;
  //     this.ctx.beginPath();
  //     this.ctx.moveTo(0, -h/2);
  //     this.ctx.lineTo(w/2, 0);
  //     this.ctx.lineTo(0, h/2);
  //     this.ctx.lineTo(-w/2, 0);
  //     this.ctx.closePath();
  //     this.ctx.fill();
      
  //     // Accent lines
  //     this.ctx.strokeStyle = this.shadeColor(color, -40);
  //     this.ctx.lineWidth = 2;
  //     this.ctx.beginPath();
  //     this.ctx.moveTo(-w/3, -h/5);
  //     this.ctx.lineTo(w/3, -h/5);
  //     this.ctx.stroke();
      
  //     // Robot eye (slim visor)
  //     this.ctx.fillStyle = '#00FFCC';
  //     this.ctx.fillRect(-w/4, -h/4, w/2, h/10);
  //   }
    
  //   // Draw gun/weapon
  //   this.ctx.fillStyle = '#333333';
  //   this.ctx.fillRect(0, -3, 25, 6);
    
  //   // Restore context
  //   this.ctx.restore();
    
  //   // Reset opacity
  //   this.ctx.globalAlpha = 1.0;
    
  //   // Draw dash cooldown indicator
  //   if (this.player.dashCooldown > 0) {
  //     const dashPercent = this.player.dashCooldown / 3; // 3 second cooldown
  //     this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  //     this.ctx.beginPath();
  //     this.ctx.arc(
  //       x + w/2, y + h/2,
  //       w * 0.8,
  //       -Math.PI/2,
  //       -Math.PI/2 + (1 - dashPercent) * Math.PI * 2
  //     );
  //     this.ctx.lineTo(x + w/2, y + h/2);
  //     this.ctx.fill();
  //   }
  // }

  // helper function to lighten/darken colors
  
  renderPlayer(deltaTime) {
    if (!this.player) return;
    
    // Calculate movement animation offsets using sine wave
    const walkCycle = Math.sin(this.gameTime * 5);
    const armSwing = walkCycle * 0.2;
    const legSwing = walkCycle * 0.3;
    const bodyBob = Math.abs(walkCycle) * 2;
    
    // Flash when invulnerable
    if (this.player.invulnerable && Math.floor(this.gameTime * 10) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }
    
    const x = this.player.x;
    const y = this.player.y - bodyBob;
    const w = this.player.width;
    const h = this.player.height;
    const robotType = this.player.type || 'assault';
    const isMoving = this.player.velocityX !== 0 || this.player.velocityY !== 0;
    
    // Calculate angle to face mouse or movement direction
    let angle;
    if (isMoving && !this.player.faceMouseWhileMoving) {
      angle = Math.atan2(this.player.velocityY, this.player.velocityX);
    } else {
      const mouseWorldX = this.mouse.x + this.camera.x;
      const mouseWorldY = this.mouse.y + this.camera.y;
      angle = Math.atan2(mouseWorldY - (y + h/2), mouseWorldX - (x + w/2));
    }
    
    // Save context for rotation
    this.ctx.save();
    this.ctx.translate(x + w/2, y + h/2);
    this.ctx.rotate(angle);
    
    // Base color from robot type
    const color = this.player.color;
    const darkColor = this.shadeColor(color, -30);
    const lightColor = this.shadeColor(color, 30);
    
    // Draw shadow beneath robot to create impression of height
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, h/6, w/2.2, h/4, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // DRAW ROBOT BODY BASED ON TYPE (PERSPECTIVE VIEW)
    if (robotType === 'assault') {
      // ---- ASSAULT ROBOT ----
      
      // // Legs (pure top-down view)
      // this.ctx.fillStyle = darkColor;

      // // Left leg
      // this.ctx.save();
      // this.ctx.rotate(legSwing * 0.2);

      // // Hip joint (armored)
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.arc(-w/5, h/10, w/14, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Add detailed joint components
      // this.ctx.strokeStyle = lightColor;
      // this.ctx.lineWidth = 1;
      // this.ctx.beginPath();
      // this.ctx.arc(-w/5, h/10, w/20, 0, Math.PI * 2);
      // this.ctx.stroke();

      // // Thigh - angular armored plate style
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/5 - w/15, h/10);
      // this.ctx.lineTo(-w/5 + w/15, h/10);
      // this.ctx.lineTo(-w/5 + w/12, h/10 + h/8);
      // this.ctx.lineTo(-w/5 - w/12, h/10 + h/8);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Knee servo joint (tactical look)
      // this.ctx.fillStyle = color;
      // this.ctx.beginPath();
      // this.ctx.arc(-w/5, h/10 + h/8, w/16, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Knee detail lines
      // this.ctx.strokeStyle = '#000000';
      // this.ctx.lineWidth = 1;
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/5 - w/20, h/10 + h/8);
      // this.ctx.lineTo(-w/5 + w/20, h/10 + h/8);
      // this.ctx.stroke();

      // // Lower leg - combat boot style
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/5 - w/12, h/10 + h/8);
      // this.ctx.lineTo(-w/5 + w/12, h/10 + h/8);
      // this.ctx.lineTo(-w/5 + w/10 + 4, h/10 + h/4 + h/8);
      // this.ctx.lineTo(-w/5 - w/10 - 4, h/10 + h/4 + h/8);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Tactical boot details - ankle armor
      // this.ctx.fillStyle = '#222222';
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/5 - w/15, h/10 + h/8 + h/12);
      // this.ctx.lineTo(-w/5 + w/15, h/10 + h/8 + h/12);
      // this.ctx.lineTo(-w/5 + w/12, h/10 + h/8 + h/8);
      // this.ctx.lineTo(-w/5 - w/12, h/10 + h/8 + h/8);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Combat boot tread pattern
      // this.ctx.fillStyle = '#111111';
      // this.ctx.fillRect(-w/5 - w/11, h/10 + h/4 + h/10, w/5.5, h/16);

      // // Heat vent/power indicator
      // const heatGlow = 0.5 + Math.abs(Math.sin(this.gameTime * 8)) * 0.5;
      // this.ctx.fillStyle = `rgba(255, 120, 0, ${heatGlow})`;
      // this.ctx.beginPath();
      // this.ctx.arc(-w/5 - w/15, h/10 + h/15, w/25, 0, Math.PI * 2);
      // this.ctx.fill();
      // this.ctx.restore();

      // // Right leg (mirrored with variations)
      // this.ctx.save();
      // this.ctx.rotate(-legSwing * 0.2);

      // // Hip joint (armored)
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.arc(w/5, h/10, w/14, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Add detailed joint components
      // this.ctx.strokeStyle = lightColor;
      // this.ctx.lineWidth = 1;
      // this.ctx.beginPath();
      // this.ctx.arc(w/5, h/10, w/20, 0, Math.PI * 2);
      // this.ctx.stroke();

      // // Thigh - angular armored plate style
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.moveTo(w/5 - w/15, h/10);
      // this.ctx.lineTo(w/5 + w/15, h/10);
      // this.ctx.lineTo(w/5 + w/12, h/10 + h/8);
      // this.ctx.lineTo(w/5 - w/12, h/10 + h/8);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Knee servo joint (tactical look)
      // this.ctx.fillStyle = color;
      // this.ctx.beginPath();
      // this.ctx.arc(w/5, h/10 + h/8, w/16, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Knee detail lines
      // this.ctx.strokeStyle = '#000000';
      // this.ctx.lineWidth = 1;
      // this.ctx.beginPath();
      // this.ctx.moveTo(w/5 - w/20, h/10 + h/8);
      // this.ctx.lineTo(w/5 + w/20, h/10 + h/8);
      // this.ctx.stroke();

      // // Lower leg - combat boot style
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.moveTo(w/5 - w/12, h/10 + h/8);
      // this.ctx.lineTo(w/5 + w/12, h/10 + h/8);
      // this.ctx.lineTo(w/5 + w/10 + 4, h/10 + h/4 + h/8);
      // this.ctx.lineTo(w/5 - w/10 - 4, h/10 + h/4 + h/8);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Tactical boot details - ankle armor
      // this.ctx.fillStyle = '#222222';
      // this.ctx.beginPath();
      // this.ctx.moveTo(w/5 - w/15, h/10 + h/8 + h/12);
      // this.ctx.lineTo(w/5 + w/15, h/10 + h/8 + h/12);
      // this.ctx.lineTo(w/5 + w/12, h/10 + h/8 + h/8);
      // this.ctx.lineTo(w/5 - w/12, h/10 + h/8 + h/8);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Combat boot tread pattern
      // this.ctx.fillStyle = '#111111';
      // this.ctx.fillRect(w/5 - w/11, h/10 + h/4 + h/10, w/5.5, h/16);

      // // Heat vent/power indicator
      // const heatGlowRight = 0.5 + Math.abs(Math.sin(this.gameTime * 8 + 1)) * 0.5;
      // this.ctx.fillStyle = `rgba(255, 120, 0, ${heatGlowRight})`;
      // this.ctx.beginPath();
      // this.ctx.arc(w/5 + w/15, h/10 + h/15, w/25, 0, Math.PI * 2);
      // this.ctx.fill();
      // this.ctx.restore();
      
      // Main body (appears as oval from top)
      const bodyGradient = this.ctx.createLinearGradient(0, -h/5, 0, h/5);
      bodyGradient.addColorStop(0, lightColor);
      bodyGradient.addColorStop(1, color);
      
      this.ctx.fillStyle = bodyGradient;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, w/3, h/3.5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Shoulder armor pieces (creates depth impression)
      this.ctx.fillStyle = darkColor;
      
      // Left shoulder
      this.ctx.save();
      this.ctx.rotate(armSwing * 0.3);
      this.ctx.beginPath();
      this.ctx.ellipse(-w/3, -h/15, w/9, h/12, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      // Right shoulder
      this.ctx.save();
      this.ctx.rotate(-armSwing * 0.3);
      this.ctx.beginPath();
      this.ctx.ellipse(w/3, -h/15, w/9, h/12, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      // Arms (from top-down perspective)
      this.ctx.fillStyle = color;
      
      // Left arm
      this.ctx.save();
      this.ctx.rotate(armSwing);
      this.ctx.fillRect(-w/2.5, -h/15, w/4, h/10);
      this.ctx.restore();
      
      // Right arm
      this.ctx.save();
      this.ctx.rotate(-armSwing);
      this.ctx.fillRect(w/4.5, -h/15, w/4, h/10);
      this.ctx.restore();
      
      // Head - visible from top
      this.ctx.fillStyle = lightColor;
      this.ctx.beginPath();
      this.ctx.arc(0, -h/5, w/6, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Face details - looks like a visor from above
      const eyeOpen = !isMoving || Math.floor(this.gameTime * 5) % 4 !== 0;
      if (eyeOpen) {
        // Visor seen from top
        this.ctx.fillStyle = '#88CCFF';
        this.ctx.beginPath();
        this.ctx.ellipse(0, -h/5, w/12, w/8, 0, 0, Math.PI);
        this.ctx.fill();
        
        // Tech details
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(-w/15, -h/5, w/30, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      // Chest details/tech
      this.ctx.fillStyle = lightColor;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, w/10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Power core glow - pulsing
      const glowSize = 1 + Math.sin(this.gameTime * 3) * 0.2;
      this.ctx.fillStyle = '#88CCFF';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, (w/15) * glowSize, 0, Math.PI * 2);
      this.ctx.fill();
      
    } else if (robotType === 'tank') {
      // ---- TANK ROBOT ----
      
      // Heavy armored legs instead of treads
      // this.ctx.fillStyle = darkColor;
      // // Left front leg
      // this.ctx.save();
      // this.ctx.translate(-w/3, -h/8);
      // this.ctx.rotate(legSwing * 0.07); // Subtle movement

      // // Upper leg joint (hip)
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.arc(0, 0, w/10, 0, Math.PI * 2); // Wider joint
      // this.ctx.fill();

      // // Add mechanical detail to joint
      // this.ctx.strokeStyle = '#444444';
      // this.ctx.lineWidth = 2;
      // this.ctx.beginPath();
      // this.ctx.arc(0, 0, w/14, 0, Math.PI * 2);
      // this.ctx.stroke();

      // // Heavy upper leg segment - wider
      // this.ctx.fillRect(-w/12, 0, w/6, h/5); // Increased from w/8 to w/6

      // // Knee joint - wider
      // this.ctx.beginPath();
      // this.ctx.arc(0, h/5, w/12, 0, Math.PI * 2); // Increased from w/14
      // this.ctx.fill();

      // // Lower leg (wider at bottom)
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/10, h/5); // Wider top (-w/12 → -w/10)
      // this.ctx.lineTo(w/10, h/5);  // Wider top (w/12 → w/10)
      // this.ctx.lineTo(w/8, h/3 + h/10); // Wider bottom (w/10 → w/8)
      // this.ctx.lineTo(-w/8, h/3 + h/10); // Wider bottom (-w/10 → -w/8)
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Foot plate - wider
      // this.ctx.fillStyle = '#333333';
      // this.ctx.fillRect(-w/8, h/3 + h/10 - 2, w/4, h/16); // Wider (w/4.5 → w/4)

      // // Armored plates on leg - wider
      // this.ctx.fillStyle = '#555555';
      // this.ctx.fillRect(-w/12, h/10, w/6, h/20); // Wider (w/7 → w/6)
      // this.ctx.restore();

      // // Left rear leg
      // this.ctx.save();
      // this.ctx.translate(-w/3, h/6);
      // this.ctx.rotate(-legSwing * 0.07); // Opposite movement to front leg

      // // Upper leg joint (hip)
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.arc(0, 0, w/12, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Add mechanical detail to joint
      // this.ctx.strokeStyle = '#444444';
      // this.ctx.lineWidth = 2;
      // this.ctx.beginPath();
      // this.ctx.arc(0, 0, w/16, 0, Math.PI * 2);
      // this.ctx.stroke();

      // // Heavy upper leg segment
      // this.ctx.fillRect(-w/16, 0, w/8, h/5);

      // // Knee joint
      // this.ctx.beginPath();
      // this.ctx.arc(0, h/5, w/14, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Lower leg (wider at bottom)
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/12, h/5);
      // this.ctx.lineTo(w/12, h/5);
      // this.ctx.lineTo(w/10, h/3 + h/10);
      // this.ctx.lineTo(-w/10, h/3 + h/10);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Foot plate
      // this.ctx.fillStyle = '#333333';
      // this.ctx.fillRect(-w/9, h/3 + h/10 - 2, w/4.5, h/16);

      // // Armored plates on leg
      // this.ctx.fillStyle = '#555555';
      // this.ctx.fillRect(-w/14, h/10, w/7, h/20);
      // this.ctx.restore();

      // // Right front leg
      // this.ctx.save();
      // this.ctx.translate(w/3, -h/8);
      // this.ctx.rotate(-legSwing * 0.07); // Mirror movement of left leg

      // // Upper leg joint (hip)
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.arc(0, 0, w/12, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Add mechanical detail to joint
      // this.ctx.strokeStyle = '#444444';
      // this.ctx.lineWidth = 2;
      // this.ctx.beginPath();
      // this.ctx.arc(0, 0, w/16, 0, Math.PI * 2);
      // this.ctx.stroke();

      // // Heavy upper leg segment
      // this.ctx.fillRect(-w/16, 0, w/8, h/5);

      // // Knee joint
      // this.ctx.beginPath();
      // this.ctx.arc(0, h/5, w/14, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Lower leg (wider at bottom)
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/12, h/5);
      // this.ctx.lineTo(w/12, h/5);
      // this.ctx.lineTo(w/10, h/3 + h/10);
      // this.ctx.lineTo(-w/10, h/3 + h/10);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Foot plate
      // this.ctx.fillStyle = '#333333';
      // this.ctx.fillRect(-w/9, h/3 + h/10 - 2, w/4.5, h/16);

      // // Armored plates on leg
      // this.ctx.fillStyle = '#555555';
      // this.ctx.fillRect(-w/14, h/10, w/7, h/20);
      // this.ctx.restore();

      // // Right rear leg
      // this.ctx.save();
      // this.ctx.translate(w/3, h/6);
      // this.ctx.rotate(legSwing * 0.07); // Opposite movement to right front leg

      // // Upper leg joint (hip)
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.arc(0, 0, w/12, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Add mechanical detail to joint
      // this.ctx.strokeStyle = '#444444';
      // this.ctx.lineWidth = 2;
      // this.ctx.beginPath();
      // this.ctx.arc(0, 0, w/16, 0, Math.PI * 2);
      // this.ctx.stroke();

      // // Heavy upper leg segment
      // this.ctx.fillRect(-w/16, 0, w/8, h/5);

      // // Knee joint
      // this.ctx.beginPath();
      // this.ctx.arc(0, h/5, w/14, 0, Math.PI * 2);
      // this.ctx.fill();

      // // Lower leg (wider at bottom)
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/12, h/5);
      // this.ctx.lineTo(w/12, h/5);
      // this.ctx.lineTo(w/10, h/3 + h/10);
      // this.ctx.lineTo(-w/10, h/3 + h/10);
      // this.ctx.closePath();
      // this.ctx.fill();

      // // Foot plate
      // this.ctx.fillStyle = '#333333';
      // this.ctx.fillRect(-w/9, h/3 + h/10 - 2, w/4.5, h/16);

      // // Armored plates on leg
      // this.ctx.fillStyle = '#555555';
      // this.ctx.fillRect(-w/14, h/10, w/7, h/20);
      // this.ctx.restore();

      // Main body - appears as heavy angular shape from top (keep this part)
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      // Create hexagonal shape for the body
      for (let i = 0; i < 6; i++) {
        const bodyAngle = (Math.PI / 3) * i;
        const bodyRadius = i % 2 === 0 ? w/2.8 : w/3.5; // Makes it more angular
        const bx = Math.cos(bodyAngle) * bodyRadius;
        const by = Math.sin(bodyAngle) * bodyRadius * 0.8;
        if (i === 0) this.ctx.moveTo(bx, by);
        else this.ctx.lineTo(bx, by);
      }
      this.ctx.closePath();
      this.ctx.fill();

      // Add hydraulic details to sides of tank body
      this.ctx.fillStyle = '#444444';
      this.ctx.fillRect(-w/2.7, -h/10, w/15, h/5);
      this.ctx.fillRect(w/2.7 - w/15, -h/10, w/15, h/5);

      // Add some tank-like armor plating to the body
      this.ctx.strokeStyle = '#555555';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(-w/4, -h/6);
      this.ctx.lineTo(w/4, -h/6);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(-w/3.5, h/7);
      this.ctx.lineTo(w/3.5, h/7);
      this.ctx.stroke();
      // Create hexagonal shape for the body (looks like shoulders from top)
      for (let i = 0; i < 6; i++) {
        const bodyAngle = (Math.PI / 3) * i;
        const bodyRadius = i % 2 === 0 ? w/2.8 : w/3.5; // Makes it more angular
        const bx = Math.cos(bodyAngle) * bodyRadius;
        const by = Math.sin(bodyAngle) * bodyRadius * 0.8;
        if (i === 0) this.ctx.moveTo(bx, by);
        else this.ctx.lineTo(bx, by);
      }
      this.ctx.closePath();
      this.ctx.fill();
      
      // Heavy shoulder pads that move slightly with walking
      this.ctx.fillStyle = darkColor;
      
      // Left shoulder armor
      this.ctx.save();
      this.ctx.translate(-w/2.5, 0);
      this.ctx.rotate(legSwing * 0.05);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, w/7, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      // Right shoulder armor
      this.ctx.save();
      this.ctx.translate(w/2.5, 0);
      this.ctx.rotate(-legSwing * 0.05);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, w/7, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
      
      // Helmet/head - appears as circular top from above
      this.ctx.fillStyle = darkColor;
      this.ctx.beginPath();
      this.ctx.arc(0, -h/6, w/5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Visor seen from above
      const visorAlpha = isMoving ? 0.6 + Math.abs(walkCycle) * 0.4 : 1;
      this.ctx.fillStyle = `rgba(255, 50, 50, ${visorAlpha})`;
      this.ctx.beginPath();
      this.ctx.ellipse(0, -h/6, w/7, w/12, 0, 0, Math.PI);
      this.ctx.fill();
      
      // Chest armor plate (center light)
      this.ctx.fillStyle = lightColor;
      this.ctx.beginPath();
      this.ctx.moveTo(-w/6, -h/12);
      this.ctx.lineTo(w/6, -h/12);
      this.ctx.lineTo(w/8, h/12);
      this.ctx.lineTo(-w/8, h/12);
      this.ctx.closePath();
      this.ctx.fill();
      
      // // Tank treads detail (edges)
      // this.ctx.strokeStyle = '#222222';
      // this.ctx.lineWidth = 2;
      
      // Draw treads pattern on sides
      // const treadCount = 5;
      // const treadStep = h/6 / treadCount;
      
      // for (let i = 0; i < treadCount; i++) {
      //   const ty = i * treadStep + h/10;
        
      //   // Left tread marks
      //   this.ctx.beginPath();
      //   this.ctx.moveTo(-w/4 - 8, ty);
      //   this.ctx.lineTo(-w/4 + 8, ty);
      //   this.ctx.stroke();
        
      //   // Right tread marks
      //   this.ctx.beginPath();
      //   this.ctx.moveTo(w/4 - 8, ty);
      //   this.ctx.lineTo(w/4 + 8, ty);
      //   this.ctx.stroke();
      // }
      
    } else {
      // ---- STEALTH ROBOT ----
      
      // // Slim legs (seen from above as thin segments)
      // this.ctx.fillStyle = darkColor;

      // // Left leg - moved lower
      // this.ctx.save();
      // this.ctx.rotate(legSwing * 0.3);
      // // Upper segment (thinner) - y position increased
      // this.ctx.fillRect(-w/6 - 2, h/6, w/18, h/10);
      // // Knee joint (small circular connector) - y position increased
      // this.ctx.fillStyle = lightColor;
      // this.ctx.beginPath();
      // this.ctx.arc(-w/6 + w/36 - 2, h/6 + h/10, w/24, 0, Math.PI * 2);
      // this.ctx.fill();
      // // Lower segment (wider at bottom for foot) - y position increased
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/6 - 3, h/6 + h/10);
      // this.ctx.lineTo(-w/6 + w/18, h/6 + h/10);
      // this.ctx.lineTo(-w/6 + w/15, h/6 + h/5 + h/8);
      // this.ctx.lineTo(-w/6 - 5, h/6 + h/5 + h/8);
      // this.ctx.closePath();
      // this.ctx.fill();
      // // Foot highlight - y position increased
      // this.ctx.strokeStyle = lightColor;
      // this.ctx.lineWidth = 1;
      // this.ctx.beginPath();
      // this.ctx.moveTo(-w/6 - 4, h/6 + h/5 + h/12);
      // this.ctx.lineTo(-w/6 + w/15 - 1, h/6 + h/5 + h/12);
      // this.ctx.stroke();
      // this.ctx.restore();

      // // Right leg (mirrored) - moved lower
      // this.ctx.save();
      // this.ctx.rotate(-legSwing * 0.3);
      // // Upper segment (thinner) - y position increased
      // this.ctx.fillStyle = darkColor;
      // this.ctx.fillRect(w/6 - w/18, h/6, w/18, h/10);
      // // Knee joint - y position increased
      // this.ctx.fillStyle = lightColor;
      // this.ctx.beginPath();
      // this.ctx.arc(w/6 - w/36, h/6 + h/10, w/24, 0, Math.PI * 2);
      // this.ctx.fill();
      // // Lower segment - y position increased
      // this.ctx.fillStyle = darkColor;
      // this.ctx.beginPath();
      // this.ctx.moveTo(w/6 - w/18 - 1, h/6 + h/10);
      // this.ctx.lineTo(w/6 + 2, h/6 + h/10);
      // this.ctx.lineTo(w/6 + 4, h/6 + h/5 + h/8);
      // this.ctx.lineTo(w/6 - w/15 - 3, h/6 + h/5 + h/8);
      // this.ctx.closePath();
      // this.ctx.fill();
      // // Foot highlight - y position increased
      // this.ctx.strokeStyle = lightColor;
      // this.ctx.lineWidth = 1;
      // this.ctx.beginPath();
      // this.ctx.moveTo(w/6 - w/15 - 2, h/6 + h/5 + h/12);
      // this.ctx.lineTo(w/6 + 3, h/6 + h/5 + h/12);
      // this.ctx.stroke();
      // this.ctx.restore();
      
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -h/4);   // Top
      this.ctx.lineTo(w/3, 0);    // Right
      this.ctx.lineTo(0, h/4);    // Bottom
      this.ctx.lineTo(-w/3, 0);   // Left
      this.ctx.closePath();
      this.ctx.fill();
      
      // Shoulder details (thin)
      this.ctx.fillStyle = darkColor;
      
      // Left shoulder
      this.ctx.save();
      this.ctx.translate(-w/3, 0);
      this.ctx.rotate(armSwing * 0.5);
      this.ctx.fillRect(-w/12, -h/20, w/6, h/12);
      this.ctx.restore();
      
      // Right shoulder
      this.ctx.save();
      this.ctx.translate(w/3, 0);
      this.ctx.rotate(-armSwing * 0.5);
      this.ctx.fillRect(-w/12, -h/20, w/6, h/12);
      this.ctx.restore();
      
      // Ninja-like head/hood
      const headTilt = isMoving ? walkCycle * 0.1 : 0;
      this.ctx.save();
      this.ctx.rotate(headTilt);

      
      // Hood shadow (from above)
      this.ctx.fillStyle = darkColor;
      this.ctx.beginPath();
      this.ctx.ellipse(0, -h/6, w/7, h/10, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Masked face - glowing visor seen from top
      const maskBrightness = isMoving ? 120 + Math.abs(walkCycle) * 80 : 200;
      this.ctx.fillStyle = `rgb(0, ${maskBrightness}, ${maskBrightness})`;
      this.ctx.beginPath();
      this.ctx.ellipse(0, -h/6, w/9, w/8, 0, 0, Math.PI);
      this.ctx.fill();
      this.ctx.restore();
      
      // Armor details and scarf/cloth effects
      this.ctx.strokeStyle = lightColor;
      this.ctx.lineWidth = 2;
      
      // Scarf/cloth flow effect (trailing behind based on movement)
      if (isMoving) {
        this.ctx.save();
        this.ctx.rotate(-Math.PI/4 + walkCycle * 0.2);
        this.ctx.beginPath();
        this.ctx.moveTo(-w/8, -h/4);
        this.ctx.quadraticCurveTo(
          -w/4 - walkCycle * 5, 
          -h/8 + walkCycle * 3, 
          -w/3 - walkCycle * 10, 
          h/6 + walkCycle * 5
        );
        this.ctx.quadraticCurveTo(
          -w/4 - walkCycle * 8, 
          h/10 + walkCycle * 3, 
          -w/6 - walkCycle * 5, 
          h/10
        );
        this.ctx.stroke();
        this.ctx.restore();
      }
      
      // Tech details/power sources on body
      for (let i = 0; i < 3; i++) {
        const glowPulse = 0.5 + Math.sin(this.gameTime * 3 + i) * 0.5;
        this.ctx.fillStyle = `rgba(0, 220, 200, ${glowPulse * 0.7})`;
        const angle = (i * Math.PI * 2 / 3) + (Math.PI/6);
        const glowX = Math.cos(angle) * w/6;
        const glowY = Math.sin(angle) * h/8;
        this.ctx.beginPath();
        this.ctx.arc(glowX, glowY, w/25, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // Draw weapon (extending forward)
    const recoilOffset = isMoving ? Math.abs(walkCycle) * 2 : 0;
    const weaponGradient = this.ctx.createLinearGradient(recoilOffset, 0, 25 - recoilOffset, 0);
    weaponGradient.addColorStop(0, '#444444');
    weaponGradient.addColorStop(1, '#222222');
    
    this.ctx.fillStyle = weaponGradient;
    this.ctx.fillRect(recoilOffset, -3, 25 - recoilOffset, 6);
    
    // Add weapon details
    this.ctx.fillStyle = '#111111';
    this.ctx.fillRect(recoilOffset + 18, -4, 5, 8);
    
    // Weapon glow based on robot type
    this.ctx.fillStyle = robotType === 'assault' ? '#88CCFF' : 
                       (robotType === 'tank' ? '#FF5500' : '#00FFCC');
    this.ctx.beginPath();
    this.ctx.arc(recoilOffset + 22, 0, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Restore context
    this.ctx.restore();
    
    // Reset opacity
    this.ctx.globalAlpha = 1.0;
    
    // Draw dash cooldown indicator
    if (this.player.dashCooldown > 0) {
      const dashPercent = this.player.dashCooldown / 3;
      
      // Background circle
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(x + w/2, y + h/2, w * 0.8, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Progress indicator
      this.ctx.fillStyle = robotType === 'assault' ? 'rgba(76, 175, 80, 0.3)' : 
                          (robotType === 'tank' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(33, 150, 243, 0.3)');
      this.ctx.beginPath();
      this.ctx.arc(
        x + w/2, y + h/2,
        w * 0.8,
        -Math.PI/2,
        -Math.PI/2 + (1 - dashPercent) * Math.PI * 2
      );
      this.ctx.lineTo(x + w/2, y + h/2);
      this.ctx.fill();
    }
    
    // Draw movement dust particles when moving fast
    if (isMoving && this.player.currentSpeed > 50) {
      const particleDelta = deltaTime || 0.016;
      
      for (let i = 0; i < 3; i++) {
        const particleSize = Math.random() * 3 + 1;
        const offsetX = (Math.random() - 0.5) * w;
        const offsetY = (Math.random() - 0.5) * h;
        
        this.ctx.fillStyle = `rgba(200, 200, 200, ${Math.random() * 0.5})`;
        this.ctx.beginPath();
        this.ctx.arc(
          x + w/2 - this.player.velocityX * particleDelta * 3 + offsetX,
          y + h/2 - this.player.velocityY * particleDelta * 3 + offsetY,
          particleSize,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }
    }
  }

  shadeColor(color, percent) {
    let R = parseInt(color.substring(1,3), 16);
    let G = parseInt(color.substring(3,5), 16);
    let B = parseInt(color.substring(5,7), 16);
  
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);
  
    R = (R < 255) ? R : 255;  
    G = (G < 255) ? G : 255;  
    B = (B < 255) ? B : 255;  
  
    R = Math.max(0, R);
    G = Math.max(0, G);
    B = Math.max(0, B);
  
    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));
  
    return "#"+RR+GG+BB;
  }

  renderLighting() {
    // Create a gradient for player light
    const gradient = this.ctx.createRadialGradient(
      this.player.x + this.player.width/2, 
      this.player.y + this.player.height/2, 
      0, 
      this.player.x + this.player.width/2, 
      this.player.y + this.player.height/2, 
      200
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.player.x - 200, this.player.y - 200, 400, 400);
    
    // Add smaller lights for bullets
    this.bullets.forEach(bullet => {
      if (bullet.fromPlayer) {
        const bulletLight = this.ctx.createRadialGradient(
          bullet.x + bullet.width/2, 
          bullet.y + bullet.height/2, 
          0, 
          bullet.x + bullet.width/2, 
          bullet.y + bullet.height/2, 
          30
        );
        
        bulletLight.addColorStop(0, 'rgba(255, 255, 100, 0.2)');
        bulletLight.addColorStop(1, 'rgba(255, 255, 100, 0)');
        
        this.ctx.fillStyle = bulletLight;
        this.ctx.fillRect(bullet.x - 30, bullet.y - 30, 60, 60);
      }
    });
  }
  
  renderGrid() {
    const gridSize = 100;
    const worldSize = 2000;
    
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    this.ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x <= worldSize; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, worldSize);
      this.ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= worldSize; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(worldSize, y);
      this.ctx.stroke();
    }

    // Add glow to grid near player
    if (this.player) {
      const gradient = this.ctx.createRadialGradient(
        this.player.x, this.player.y, 0,
        this.player.x, this.player.y, 300
      );
      
      gradient.addColorStop(0, 'rgba(63, 81, 181, 0.1)');
      gradient.addColorStop(1, 'rgba(63, 81, 181, 0)');
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(this.player.x - 300, this.player.y - 300, 600, 600);
    }
  }
  
  renderDebugInfo() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 220, 160);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    
    this.ctx.fillText(`FPS: ${Math.round(1 / ((performance.now() - this.lastTime) / 1000))}`, 20, 30);
    this.ctx.fillText(`Game Time: ${this.gameTime.toFixed(1)}s`, 20, 50);
    this.ctx.fillText(`Enemies: ${this.enemies.length} + ${this.waveEnemies} queued`, 20, 70);
    this.ctx.fillText(`Bullets: ${this.bullets.length}`, 20, 90);
    this.ctx.fillText(`Explosions: ${this.explosions.length}`, 20, 110);
    this.ctx.fillText(`Powerups: ${this.powerups.length}`, 20, 130);
    
    if (this.player) {
      this.ctx.fillText(`Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, 20, 150);
    }
  }
  
  updateHealthBar() {
    if (!this.player) return;
    const healthPercent = (this.player.health / this.player.maxHealth) * 100;
    document.getElementById('health-fill').style.width = `${healthPercent}%`;
    document.getElementById('health-text').textContent = `${Math.floor(this.player.health)}/${this.player.maxHealth}`;
  }

  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update position
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      
      // Update lifetime and fade
      particle.lifetime -= deltaTime;
      particle.alpha = particle.lifetime / (particle.lifetime + deltaTime);
      
      // Remove expired particles
      if (particle.lifetime <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  showMessage(text, duration = 2000) {
    const messageContainer = document.getElementById('message-container');
    const message = document.createElement('div');
    message.className = 'game-message';
    message.textContent = text;
    messageContainer.appendChild(message);
    
    setTimeout(() => {
      message.classList.add('fade-out');
      setTimeout(() => message.remove(), 500);
    }, duration);
  }
  
  checkCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // debugSounds() {
  //   console.log("Sound status:");
  //   console.log("SFX enabled:", this.sfxEnabled);
  //   console.log("Music enabled:", this.musicEnabled);
    
  //   Object.entries(this.sounds).forEach(([name, sound]) => {
  //     console.log(`${name}:`, {
  //       readyState: sound.readyState,
  //       paused: sound.paused,
  //       muted: sound.muted,
  //       volume: sound.volume,
  //       src: sound.src
  //     });
      
  //     // Try playing explosion sound directly
  //     if (name === 'explosion') {
  //       const explosionSound = this.sounds.explosion;
  //       explosionSound.currentTime = 0;
  //       explosionSound.play()
  //         .then(() => console.log("Explosion sound played successfully"))
  //         .catch(e => console.error("Failed to play explosion sound:", e));
  //     }
  //   });
  // }
}

// Initialize game on window load
window.addEventListener('load', () => {
  new RoboRebellion();
  
  // Select assault bot by default
  document.querySelector('.character[data-type="assault"]').classList.add('selected');
});