class SimpleGame {
  constructor() {
    // Basic initialization
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Simple game state
    this.state = 'playing';
    this.score = 0;
    
    // Create player
    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      width: 40,
      height: 40,
      speed: 200,
      color: '#4CAF50',
      health: 100,
      maxHealth: 100
    };
    
    // Simple camera
    this.camera = { x: 0, y: 0 };
    
    // Simple collections
    this.enemies = [];
    this.bullets = [];
    
    // Input handling
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false };
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Debug flag
    this.showDebug = true;
    
    // Start game loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
    
    console.log("SimpleGame initialized successfully!");
  }
  
  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', e => {
      this.keys[e.key] = true;
      console.log(`Key pressed: ${e.key}`);
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
    
    this.canvas.addEventListener('mousedown', () => {
      this.mouse.isDown = true;
      this.createBullet();
    });
    
    this.canvas.addEventListener('mouseup', () => {
      this.mouse.isDown = false;
    });
    
    // Toggle debug mode
    window.addEventListener('keydown', e => {
      if (e.key === 'd') {
        this.showDebug = !this.showDebug;
      }
    });
  }
  
  gameLoop(timestamp) {
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  update(deltaTime) {
    // Update player position
    this.updatePlayer(deltaTime);
    
    // Update bullets
    this.updateBullets(deltaTime);
    
    // Update enemies
    if (Math.random() < 0.01 && this.enemies.length < 5) {
      this.createEnemy();
    }
    
    this.updateEnemies(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Update camera (center on player)
    this.camera.x = this.player.x - this.canvas.width / 2 + this.player.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2 + this.player.height / 2;
  }
  
  updatePlayer(deltaTime) {
    // Handle movement
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
    
    // Apply movement
    this.player.x += moveX * this.player.speed * deltaTime;
    this.player.y += moveY * this.player.speed * deltaTime;
  }
  
  createBullet() {
    // Calculate direction to mouse
    const dx = this.mouse.x - (this.player.x - this.camera.x);
    const dy = this.mouse.y - (this.player.y - this.camera.y);
    
    // Normalize direction
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;
    
    // Create bullet
    this.bullets.push({
      x: this.player.x + this.player.width / 2,
      y: this.player.y + this.player.height / 2,
      width: 10,
      height: 10,
      speed: 400,
      dx: normalizedDx,
      dy: normalizedDy,
      color: '#FFC107',
      damage: 20,
      lifetime: 2
    });
  }
  
  updateBullets(deltaTime) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      // Update position
      bullet.x += bullet.dx * bullet.speed * deltaTime;
      bullet.y += bullet.dy * bullet.speed * deltaTime;
      
      // Update lifetime
      bullet.lifetime -= deltaTime;
      
      // Remove if expired
      if (bullet.lifetime <= 0) {
        this.bullets.splice(i, 1);
      }
    }
  }
  
  createEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    // Spawn enemy from outside the screen
    switch (side) {
      case 0: // Top
        x = Math.random() * this.canvas.width;
        y = -50;
        break;
      case 1: // Right
        x = this.canvas.width + 50;
        y = Math.random() * this.canvas.height;
        break;
      case 2: // Bottom
        x = Math.random() * this.canvas.width;
        y = this.canvas.height + 50;
        break;
      case 3: // Left
        x = -50;
        y = Math.random() * this.canvas.height;
        break;
    }
    
    // Add camera offset
    x += this.camera.x;
    y += this.camera.y;
    
    this.enemies.push({
      x: x,
      y: y,
      width: 30,
      height: 30,
      speed: 100,
      color: '#FF5722',
      health: 40,
      maxHealth: 40,
      contactDamage: 10
    });
  }
  
  updateEnemies(deltaTime) {
    this.enemies.forEach(enemy => {
      // Move toward player
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      
      // Normalize direction
      const length = Math.sqrt(dx * dx + dy * dy);
      const normalizedDx = dx / length;
      const normalizedDy = dy / length;
      
      // Apply movement
      enemy.x += normalizedDx * enemy.speed * deltaTime;
      enemy.y += normalizedDy * enemy.speed * deltaTime;
    });
  }
  
  checkCollisions() {
    // Check bullet-enemy collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        
        if (this.checkCollision(bullet, enemy)) {
          // Damage enemy
          enemy.health -= bullet.damage;
          
          // Remove bullet
          this.bullets.splice(i, 1);
          
          // Remove enemy if dead
          if (enemy.health <= 0) {
            this.enemies.splice(j, 1);
            this.score += 100;
          }
          
          break;
        }
      }
    }
    
    // Check enemy-player collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (this.checkCollision(enemy, this.player)) {
        // Damage player
        this.player.health -= enemy.contactDamage;
        
        // Push player away
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        this.player.x += (dx / length) * 20;
        this.player.y += (dy / length) * 20;
        
        // Game over if player is dead
        if (this.player.health <= 0) {
          console.log("Game Over!");
          this.player.health = 0;
          // Restart game after delay
          setTimeout(() => {
            this.player.health = this.player.maxHealth;
            this.enemies = [];
            this.bullets = [];
            this.score = 0;
          }, 2000);
        }
      }
    }
  }
  
  checkCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
  
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Start camera transform
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);
    
    // Draw player
    this.ctx.fillStyle = this.player.color;
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Draw bullets
    this.bullets.forEach(bullet => {
      this.ctx.fillStyle = bullet.color;
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Draw enemies
    this.enemies.forEach(enemy => {
      this.ctx.fillStyle = enemy.color;
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // Draw health bar
      const healthBarWidth = enemy.width;
      const healthBarHeight = 5;
      const healthPercent = enemy.health / enemy.maxHealth;
      
      this.ctx.fillStyle = '#444';
      this.ctx.fillRect(
        enemy.x,
        enemy.y - 10,
        healthBarWidth,
        healthBarHeight
      );
      
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.fillRect(
        enemy.x,
        enemy.y - 10,
        healthBarWidth * healthPercent,
        healthBarHeight
      );
    });
    
    // End camera transform
    this.ctx.restore();
    
    // Draw UI (not affected by camera)
    this.renderUI();
    
    // Draw debug info
    if (this.showDebug) {
      this.renderDebugInfo();
    }
  }
  
  renderUI() {
    // Draw health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthPercent = this.player.health / this.player.maxHealth;
    
    this.ctx.fillStyle = '#444';
    this.ctx.fillRect(20, 20, healthBarWidth, healthBarHeight);
    
    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(20, 20, healthBarWidth * healthPercent, healthBarHeight);
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.strokeRect(20, 20, healthBarWidth, healthBarHeight);
    
    // Draw score
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 20, 60);
  }
  
  renderDebugInfo() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(this.canvas.width - 220, 10, 210, 120);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${Math.round(1 / ((performance.now() - this.lastTime) / 1000))}`, this.canvas.width - 210, 30);
    this.ctx.fillText(`Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`, this.canvas.width - 210, 50);
    this.ctx.fillText(`Camera: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, this.canvas.width - 210, 70);
    this.ctx.fillText(`Enemies: ${this.enemies.length}`, this.canvas.width - 210, 90);
    this.ctx.fillText(`Bullets: ${this.bullets.length}`, this.canvas.width - 210, 110);
  }
}

// Initialize the simple game when the window loads
window.addEventListener('load', () => {
  console.log("Window loaded, initializing SimpleGame...");
  window.game = new SimpleGame();
});