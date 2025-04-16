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
    this.state = 'menu';
      
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
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      
      // Toggle debug mode with F1
      if (e.key === 'F1') {
        this.debugMode = !this.debugMode;
        e.preventDefault();
      }
      
      // Toggle pause with Escape
      if (e.key === 'Escape' && this.state === 'playing') {
        this.state = this.state === 'paused' ? 'playing' : 'paused';
      }
      
      // Dash with space bar
      if (e.key === ' ' && this.state === 'playing' && this.player && !this.player.dashing) {
        this.player.dash();
      }
    });
    
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
  
  update(deltaTime) {
    this.gameTime += deltaTime;
    
    // Update player
    if (this.player) {
      this.updatePlayer(deltaTime);
      
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
    
    if (this.keys['ArrowUp'] || this.keys['w']) moveY -= 1;
    if (this.keys['ArrowDown'] || this.keys['s']) moveY += 1;
    if (this.keys['ArrowLeft'] || this.keys['a']) moveX -= 1;
    if (this.keys['ArrowRight'] || this.keys['d']) moveX += 1;
    
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
    
    // Apply movement
    this.player.x += moveX * this.player.speed * deltaTime;
    this.player.y += moveY * this.player.speed * deltaTime;
    
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
    
    // Create player
    const robotTemplate = this.robotTypes[robotType];
    this.player = {
      x: 1000,
      y: 1000,
      width: 40,
      height: 40,
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
      invulnerable: false
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

     // Play music (if enabled)
     if (this.musicEnabled) {
      const musicBtn = document.getElementById('toggle-music');
      if (musicBtn) musicBtn.classList.remove('muted');
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
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw game world
    if (this.state === 'playing' || this.state === 'paused') {
      this.renderGameWorld();
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
  
  renderGameWorld() {
    // Apply camera transformation
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Draw grid (world background)
    this.renderGrid();
    
    // Draw game boundary
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 5;
    this.ctx.strokeRect(0, 0, 2000, 2000);
    
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
    
    // Draw enemies
    this.enemies.forEach(enemy => {
      // Draw enemy body
      this.ctx.fillStyle = enemy.color;
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // Draw health bar
      const healthPercentage = enemy.health / (30 + this.wave * 5); // Approximate max health
      this.ctx.fillStyle = '#444444';
      this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width, 5);
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(enemy.x, enemy.y - 10, enemy.width * healthPercentage, 5);
      
      // Draw specific features based on enemy type
      switch (enemy.type) {
        case 'shooter':
          // Draw gun
          if (this.player) {
            const angle = Math.atan2(
              this.player.y - enemy.y,
              this.player.x - enemy.x
            );
            this.ctx.save();
            this.ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
            this.ctx.rotate(angle);
            this.ctx.fillStyle = '#444444';
            this.ctx.fillRect(0, -2, 20, 4);
            this.ctx.restore();
          }
          break;
        case 'tank':
          // Draw armor plating
          this.ctx.fillStyle = '#444444';
          this.ctx.fillRect(enemy.x + 5, enemy.y + 5, enemy.width - 10, enemy.height - 10);
          break;
      }
    });
    
    // Draw player
    if (this.player) {
      // Flash when invulnerable
      if (this.player.invulnerable && Math.floor(this.gameTime * 10) % 2 === 0) {
        this.ctx.globalAlpha = 0.5;
      }
      
      // Draw player body
      this.ctx.fillStyle = this.player.color;
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
      
      // Draw gun pointing toward mouse
      const mouseWorldX = this.mouse.x + this.camera.x;
      const mouseWorldY = this.mouse.y + this.camera.y;
      
      const angle = Math.atan2(
        mouseWorldY - (this.player.y + this.player.height/2),
        mouseWorldX - (this.player.x + this.player.width/2)
      );
      
      this.ctx.save();
      this.ctx.translate(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
      this.ctx.rotate(angle);
      this.ctx.fillStyle = '#333333';
      this.ctx.fillRect(0, -3, 25, 6);
      this.ctx.restore();
      
      // Reset opacity
      this.ctx.globalAlpha = 1.0;
      
      // Draw dash cooldown indicator
      if (this.player.dashCooldown > 0) {
        const dashPercent = this.player.dashCooldown / 3; // 3 second cooldown
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
          this.player.x + this.player.width/2,
          this.player.y + this.player.height/2,
          this.player.width * 0.8,
          -Math.PI/2,
          -Math.PI/2 + (1 - dashPercent) * Math.PI * 2
        );
        this.ctx.lineTo(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
        this.ctx.fill();
      }
    }
    
    // Draw bullets
    this.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.color;
      if (bullet.fromPlayer) {
        // Player bullets are circular
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.width/2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Enemy bullets are diamonds
        this.ctx.save();
        this.ctx.translate(bullet.x, bullet.y);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillRect(-bullet.width/2, -bullet.height/2, bullet.width, bullet.height);
        this.ctx.restore();
      }
    });
    
    // Draw explosions
    this.explosions.forEach(explosion => {
      this.ctx.globalAlpha = explosion.alpha;
      this.ctx.fillStyle = explosion.color;
      
      if (explosion.vx !== undefined) {
        // Particle that moves
        explosion.x += explosion.vx * 0.016; // Approx for one frame
        explosion.y += explosion.vy * 0.016;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Static explosion
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        this.ctx.fill();
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
    
    // Draw health bar
    if (this.player) {
      const healthWidth = 300;
      const healthHeight = 20;
      const healthPercent = this.player.health / this.player.maxHealth;
      
      this.ctx.fillStyle = '#444444';
      this.ctx.fillRect(20, 20, healthWidth, healthHeight);
      
      // Color based on health percentage
      if (healthPercent > 0.6) {
        this.ctx.fillStyle = '#4CAF50'; // Green
      } else if (healthPercent > 0.3) {
        this.ctx.fillStyle = '#FFC107'; // Yellow
      } else {
        this.ctx.fillStyle = '#F44336'; // Red
      }
      
      this.ctx.fillRect(20, 20, healthWidth * healthPercent, healthHeight);
      
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.strokeRect(20, 20, healthWidth, healthHeight);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        `${Math.floor(this.player.health)}/${this.player.maxHealth}`,
        20 + healthWidth / 2,
        20 + healthHeight / 2 + 7
      );
    }
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
}

// Initialize game on window load
window.addEventListener('load', () => {
  new RoboRebellion();
  
  // Select assault bot by default
  document.querySelector('.character[data-type="assault"]').classList.add('selected');
});