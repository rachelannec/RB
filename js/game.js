class Game {
  constructor() {
    // Initialize core elements
    this.initCanvas();
    this.initState();
    this.initGameWorld();
    this.initCollections();
    this.initInput();
    this.initUI();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Game configuration
    this.config = {
      difficultyScaling: 1.0,
      roomTransitionDuration: 500,
      maxEnemiesPerRoom: 8,
      powerupDropChance: 0.3
    };

    // Game statistics
    this.stats = {
      enemiesDefeated: 0,
      damageDealt: 0,
      damageTaken: 0,
      roomsVisited: 0,
      weaponsCollected: 1
    };

    // Start the game loop
    this.lastTime = performance.now();
    this.animationFrame = null;
    this.startGameLoop();
  }

  // ========================
  // Initialization Methods
  // ========================

  initCanvas() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    
    // High-DPI support
    this.pixelRatio = window.devicePixelRatio || 1;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.width = window.innerWidth * this.pixelRatio;
    this.canvas.height = window.innerHeight * this.pixelRatio;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  initState() {
    this.state = 'start';
    this.score = 0;
    this.roomsCleared = 0;
    this.currentLevel = 1;
    this.gameTime = 0;
    
    // Initialize transition state
    this.transitionState = {
      active: false,
      progress: 0,
      duration: this.config.roomTransitionDuration,
      direction: null,
      fromRoom: null,
      toRoom: null,
      startPos: { x: 0, y: 0 },
      endPos: { x: 0, y: 0 },
      cameraStart: { x: 0, y: 0 },
      cameraEnd: { x: 0, y: 0 }
    };
    
    // Initialize camera
    this.camera = { x: 0, y: 0 };
  }

  initGameWorld() {
    this.dungeon = new Dungeon({
      width: 50,
      height: 50,
      roomCount: 10,
      biomes: ['Factory', 'Server Core', 'Junkyard'],
      bossEvery: 5
    });
    
    this.currentRoom = null;
    this.playerSpawnPosition = { x: 0, y: 0 };
  }

  initCollections() {
    this.enemies = new Set();
    this.bullets = new Set();
    this.powerups = new Set();
    this.particles = new Set();
    this.effects = new Set();
    this.turrets = new Set();
  }

  initInput() {
    this.keys = {};
    this.mouse = { 
      x: 0, 
      y: 0,
      isDown: false,
      rightDown: false
    };
    
    this.gamepad = null;
    this.lastGamepadUpdate = 0;
  }

  initUI() {
    this.ui = new UI(this);
    this.notificationSystem = new NotificationSystem(this);
    this.damageNumbers = new DamageNumberSystem(this);
    this.tutorial = new TutorialSystem(this);
  }

  // ========================
  // Core Game Loop
  // ========================

  startGameLoop() {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  gameLoop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    
    if (this.state === 'playing') {
      this.gameTime += deltaTime;
      this.update(deltaTime);
    }
    
    this.render();
    this.animationFrame = requestAnimationFrame(t => this.gameLoop(t));
  }

  update(deltaTime) {
    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateBullets(deltaTime);
    this.updateTurrets(deltaTime);
    this.updatePowerups();
    this.updateParticles(deltaTime);
    this.updateEffects(deltaTime);
    this.updateRoomState();
    this.updateInputDevices();
    
    this.ui.update(deltaTime);
    this.notificationSystem.update(deltaTime);
    this.damageNumbers.update(deltaTime);
    
    this.checkPlayerState();
    this.checkRoomCompletion();
  }

  // ========================
  // Player Management
  // ========================

  spawnPlayer(robotType) {
    this.player = new Player(
      this.playerSpawnPosition.x,
      this.playerSpawnPosition.y,
      robotType,
      this
    );
    
    this.unlockedWeapons = new Set(['laserRifle']);
    this.equippedWeapons = ['laserRifle'];
    this.currentWeaponIndex = 0;
    
    this.playerStats = {
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      totalShotsFired: 0,
      totalDashesUsed: 0,
      totalAbilitiesUsed: 0
    };
    
    // Setup event listeners
    this.player.on('damage-dealt', amount => {
      this.stats.damageDealt += amount;
      this.playerStats.totalDamageDealt += amount;
    });
    
    this.player.on('damage-taken', amount => {
      this.stats.damageTaken += amount;
      this.playerStats.totalDamageTaken += amount;
    });
    
    this.player.on('shot-fired', () => {
      this.playerStats.totalShotsFired++;
    });
    
    this.player.on('dash-used', () => {
      this.playerStats.totalDashesUsed++;
    });
    
    this.player.on('ability-used', () => {
      this.playerStats.totalAbilitiesUsed++;
    });
  }

  updatePlayer(deltaTime) {
    if (!this.player) return;
    
    const moveVector = { x: 0, y: 0 };
    
    // Keyboard movement
    if (this.keys['ArrowUp'] || this.keys['w']) moveVector.y -= 1;
    if (this.keys['ArrowDown'] || this.keys['s']) moveVector.y += 1;
    if (this.keys['ArrowLeft'] || this.keys['a']) moveVector.x -= 1;
    if (this.keys['ArrowRight'] || this.keys['d']) moveVector.x += 1;
    
    // Gamepad movement
    if (this.gamepad) {
      moveVector.x += this.gamepad.axes[0];
      moveVector.y += this.gamepad.axes[1];
    }
    
    // Normalize movement vector
    const length = Math.sqrt(moveVector.x * moveVector.x + moveVector.y * moveVector.y);
    if (length > 0) {
      moveVector.x /= length;
      moveVector.y /= length;
    }
    
    // Apply movement
    this.player.move(moveVector.x, moveVector.y, deltaTime);
    
    // Handle shooting
    if (this.mouse.isDown || (this.gamepad && this.gamepad.buttons[7].pressed)) {
      this.player.shoot(this.mouse);
    }
    
    // Handle weapon switching
    if (this.keys['1'] || (this.gamepad && this.gamepad.buttons[4].pressed)) {
      this.switchWeapon(0);
    }
    if (this.keys['2'] || (this.gamepad && this.gamepad.buttons[5].pressed)) {
      this.switchWeapon(1);
    }
    
    // Handle special ability
    if (this.mouse.rightDown || (this.gamepad && this.gamepad.buttons[0].pressed)) {
      this.player.useSpecialAbility();
    }
    
    // Handle dash
    if ((this.keys[' '] || (this.gamepad && this.gamepad.buttons[1].pressed)) && 
        !this.player.isDashing && 
        this.player.dashCooldown <= 0) {
      this.player.dash();
    }
    
    // Update player state
    this.player.update(deltaTime);
  }

  switchWeapon(index) {
    if (index < this.equippedWeapons.length) {
      this.currentWeaponIndex = index;
      this.player.equipWeapon(this.equippedWeapons[index]);
      this.ui.updateWeaponInfo();
    }
  }

  // ========================
  // Enemy Management
  // ========================

  spawnEnemies() {
    if (this.currentRoom.isSafeRoom || this.currentRoom.cleared) return;
    
    const biome = this.currentRoom.biome;
    const roomCenter = this.currentRoom.getCenter();
    const playerPos = { x: this.player.x, y: this.player.y };
    
    const baseCount = Math.floor(this.currentRoom.area / 10000);
    const enemyCount = Math.min(
      this.config.maxEnemiesPerRoom,
      baseCount + this.currentLevel
    );
    
    const spawnTable = this.getBiomeSpawnTable(biome);
    
    for (let i = 0; i < enemyCount; i++) {
      const position = this.findValidSpawnPosition(roomCenter, playerPos, 200);
      if (!position) continue;
      
      const enemyType = this.weightedRandom(spawnTable);
      const enemy = this.createEnemy(enemyType, position.x, position.y);
      
      this.enemies.add(enemy);
    }
  }

  getBiomeSpawnTable(biome) {
    const tables = {
      'Factory': [
        { type: 'ScoutDrone', weight: 0.7 },
        { type: 'HeavySentry', weight: 0.3 }
      ],
      'Server Core': [
        { type: 'SniperBot', weight: 0.6 },
        { type: 'ScoutDrone', weight: 0.4 }
      ],
      'Junkyard': [
        { type: 'HeavySentry', weight: 0.8 },
        { type: 'SniperBot', weight: 0.2 }
      ]
    };
    
    return tables[biome] || tables['Factory'];
  }

  createEnemy(type, x, y) {
    switch (type) {
      case 'ScoutDrone':
        return new ScoutDrone(x, y, this);
      case 'HeavySentry':
        return new HeavySentry(x, y, this);
      case 'SniperBot':
        return new SniperBot(x, y, this);
      default:
        return new ScoutDrone(x, y, this);
    }
  }

  updateEnemies(deltaTime) {
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, this.player);
      
      if (!enemy.isFriendly && this.checkCollision(enemy, this.player) && !this.player.isInvulnerable) {
        this.player.takeDamage(enemy.contactDamage);
        this.ui.updateHealthBar();
        
        this.damageNumbers.add(
          enemy.contactDamage,
          this.player.x,
          this.player.y - 30,
          '#ff0000'
        );
        
        const angle = Math.atan2(
          this.player.y - enemy.y,
          this.player.x - enemy.x
        );
        
        this.player.applyKnockback(
          Math.cos(angle) * 15,
          Math.sin(angle) * 15
        );
      }
    });
  }

  // ========================
  // Bullet Management
  // ========================

  updateBullets(deltaTime) {
    this.bullets.forEach(bullet => {
      bullet.update(deltaTime);
      
      if (bullet.lifetime <= 0) {
        this.bullets.delete(bullet);
        return;
      }
      
      if (!this.currentRoom.contains(bullet.x, bullet.y)) {
        this.bullets.delete(bullet);
        return;
      }
      
      if (bullet.fromPlayer) {
        this.checkPlayerBulletCollision(bullet);
      } else {
        this.checkEnemyBulletCollision(bullet);
      }
    });
  }

  checkPlayerBulletCollision(bullet) {
    for (const enemy of this.enemies) {
      if (!enemy.isFriendly && this.checkCollision(bullet, enemy)) {
        enemy.takeDamage(bullet.damage);
        
        this.damageNumbers.add(
          bullet.damage,
          enemy.x,
          enemy.y - 20,
          '#ffffff'
        );
        
        if (enemy.health <= 0) {
          this.handleEnemyDefeat(enemy);
        }
        
        this.bullets.delete(bullet);
        break;
      }
    }
  }

  checkEnemyBulletCollision(bullet) {
    if (this.checkCollision(bullet, this.player) && !this.player.isInvulnerable) {
      this.player.takeDamage(bullet.damage);
      this.ui.updateHealthBar();
      
      this.damageNumbers.add(
        bullet.damage,
        this.player.x,
        this.player.y - 30,
        '#ff0000'
      );
      
      this.bullets.delete(bullet);
    }
  }

  // ========================
  // Turret Management
  // ========================

  updateTurrets(deltaTime) {
    this.turrets.forEach(turret => {
      turret.update(deltaTime);
      
      // Turret shooting logic
      if (turret.cooldown <= 0) {
        this.fireTurretShot(turret);
        turret.cooldown = turret.fireRate;
      } else {
        turret.cooldown -= deltaTime;
      }
    });
  }

  fireTurretShot(turret) {
    if (!this.enemies.size) return;

    // Find closest enemy
    let closestEnemy = null;
    let closestDistance = Infinity;

    this.enemies.forEach(enemy => {
      const dx = enemy.x - turret.x;
      const dy = enemy.y - turret.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy && closestDistance < turret.range) {
      const angle = Math.atan2(
        closestEnemy.y - turret.y,
        closestEnemy.x - turret.x
      );

      const bullet = new Bullet(
        turret.x + turret.width / 2,
        turret.y + turret.height / 2,
        Math.cos(angle) * turret.bulletSpeed,
        Math.sin(angle) * turret.bulletSpeed,
        turret.damage,
        '#795548',
        true,
        'standard'
      );

      this.bullets.add(bullet);
    }
  }

  // ========================
  // Game State Management
  // ========================

  startGame(robotType) {
    this.state = 'playing';
    this.score = 0;
    this.roomsCleared = 0;
    this.currentLevel = 1;
    this.gameTime = 0;
    
    this.enemies.clear();
    this.bullets.clear();
    this.powerups.clear();
    this.particles.clear();
    this.effects.clear();
    this.turrets.clear();
    
    this.dungeon.generate();
    this.currentRoom = this.dungeon.startRoom;
    this.playerSpawnPosition = this.currentRoom.getCenter();
    
    this.spawnPlayer(robotType);
    this.addSafeRoomPowerups();
    
    this.ui.reset();
    this.ui.updateAll();
    this.notificationSystem.show("Systems Online - Mission Start!", 2500);
    this.tutorial.start();
  }

  gameOver() {
    this.state = 'gameover';
    this.saveHighScore();
    this.ui.showGameOverScreen({
      score: this.score,
      roomsCleared: this.roomsCleared,
      timePlayed: this.gameTime,
      enemiesDefeated: this.stats.enemiesDefeated,
      damageDealt: this.stats.damageDealt,
      damageTaken: this.stats.damageTaken
    });
  }

  // ========================
  // Utility Methods
  // ========================

  findValidSpawnPosition(roomCenter, avoidPos, minDistance, maxAttempts = 20) {
    let attempts = 0;
    let position;
    
    do {
      position = {
        x: roomCenter.x + Phaser.Math.Between(-this.currentRoom.width/2 + 50, this.currentRoom.width/2 - 50),
        y: roomCenter.y + Phaser.Math.Between(-this.currentRoom.height/2 + 50, this.currentRoom.height/2 - 50)
      };
      
      attempts++;
      
      const distance = Phaser.Math.Distance.Between(
        position.x, position.y,
        avoidPos.x, avoidPos.y
      );
      
      if (distance >= minDistance) return position;
    } while (attempts < maxAttempts);
    
    return null;
  }

  checkCollision(obj1, obj2) {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj1.x + obj1.width > obj2.x &&
      obj1.y < obj2.y + obj2.height &&
      obj1.y + obj1.height > obj2.y
    );
  }

  weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      if (random < item.weight) return item.type;
      random -= item.weight;
    }
    
    return items[0].type;
  }

  // ========================
  // Event Handlers
  // ========================

  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('blur', () => this.pauseGame());
    window.addEventListener('focus', () => this.resumeGame());
    
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      if (e.key === 'Escape') this.togglePause();
    });
    
    window.addEventListener('keyup', e => {
      this.keys[e.key] = false;
    });
    
    this.canvas.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.canvas.width / rect.width) / this.pixelRatio;
      this.mouse.y = (e.clientY - rect.top) * (this.canvas.height / rect.height) / this.pixelRatio;
    });
    
    this.canvas.addEventListener('mousedown', e => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });
    
    this.canvas.addEventListener('mouseup', e => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });
    
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    
    window.addEventListener('gamepadconnected', e => {
      this.gamepad = e.gamepad;
    });
    
    window.addEventListener('gamepaddisconnected', e => {
      this.gamepad = null;
    });
  }

  updateInputDevices() {
    if (navigator.getGamepads && navigator.getGamepads()[0]) {
      this.gamepad = navigator.getGamepads()[0];
      this.lastGamepadUpdate = performance.now();
    } else if (this.lastGamepadUpdate + 5000 < performance.now()) {
      this.gamepad = null;
    }
  }

  // ========================
  // Render Methods
  // ========================

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.updateCamera();
    this.renderWorld();
    this.renderUI();
    this.renderEffects();
  }

  renderWorld() {
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    this.currentRoom.render(this.ctx);
    this.renderDoors();
    this.renderEntities();
    
    this.ctx.restore();
  }

  renderEntities() {
    this.powerups.forEach(powerup => powerup.render(this.ctx));
    
    this.bullets.forEach(bullet => {
      if (!bullet.fromPlayer) bullet.render(this.ctx);
    });
    
    this.enemies.forEach(enemy => enemy.render(this.ctx));
    this.turrets.forEach(turret => turret.render(this.ctx));
    
    if (this.player) this.player.render(this.ctx);
    
    this.bullets.forEach(bullet => {
      if (bullet.fromPlayer) bullet.render(this.ctx);
    });
    
    this.particles.forEach(particle => particle.render(this.ctx));
  }

  static init() {
    window.addEventListener('load', () => {
      const game = new Game();
      window.game = game;
      game.ui.showMainMenu();
    });
  }
}

// Initialize the game
Game.init();