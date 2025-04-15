class Player {
  constructor(x, y, type, game) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.type = type;
    this.game = game;
    
    // Initialize based on robot type
    this.initStats(type);
    
    // Dash properties
    this.isDashing = false;
    this.dashSpeed = this.speed * 3;
    this.dashDuration = 0.15; // seconds
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashMaxCooldown = 1.5; // seconds
    this.dashDirection = { x: 0, y: 0 };
    
    // Special ability cooldown
    this.specialCooldown = 0;
    this.specialMaxCooldown = 5; // seconds
    
    // Invulnerability frames
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    
    // Abilities active
    this.isOvercharged = false;
    this.isCloaked = false;
    this.abilityTimer = 0;
    
    // Event system
    this.eventListeners = {};
  }
  
  initStats(type) {
    switch (type) {
      case 'assault':
        this.color = '#4CAF50';
        this.maxHealth = 100;
        this.health = 100;
        this.maxEnergy = 100;
        this.energy = 100;
        this.energyRegenRate = 10;
        this.speed = 200;
        this.weapon = {
          id: 'laserRifle',
          name: 'Laser Rifle',
          damage: 10,
          energyCost: 5,
          bulletSpeed: 500,
          color: '#00FF00',
          type: 'standard'
        };
        this.specialAbility = {
          type: 'overcharge',
          name: 'Overcharge',
          color: '#FF5722'
        };
        break;
      case 'tank':
        this.color = '#FFC107';
        this.maxHealth = 150;
        this.health = 150;
        this.maxEnergy = 80;
        this.energy = 80;
        this.energyRegenRate = 8;
        this.speed = 150;
        this.weapon = {
          id: 'plasmaCannon',
          name: 'Plasma Cannon',
          damage: 15,
          energyCost: 8,
          bulletSpeed: 400,
          color: '#FF9800',
          type: 'plasma'
        };
        this.specialAbility = {
          type: 'shieldBurst',
          name: 'Shield Burst',
          color: '#FFEB3B'
        };
        break;
      case 'stealth':
        this.color = '#2196F3';
        this.maxHealth = 80;
        this.health = 80;
        this.maxEnergy = 120;
        this.energy = 120;
        this.energyRegenRate = 15;
        this.speed = 250;
        this.weapon = {
          id: 'railgun',
          name: 'Railgun',
          damage: 25,
          energyCost: 12,
          bulletSpeed: 800,
          color: '#03A9F4',
          type: 'railgun'
        };
        this.specialAbility = {
          type: 'cloaking',
          name: 'Cloaking',
          color: '#3F51B5'
        };
        break;
      case 'engineer':
        this.color = '#9C27B0';
        this.maxHealth = 90;
        this.health = 90;
        this.maxEnergy = 150;
        this.energy = 150;
        this.energyRegenRate = 12;
        this.speed = 180;
        this.weapon = {
          id: 'beamLaser',
          name: 'Beam Laser',
          damage: 8,
          energyCost: 4,
          bulletSpeed: 600,
          color: '#E91E63',
          type: 'beam'
        };
        this.specialAbility = {
          type: 'deployTurret',
          name: 'Turret',
          color: '#9C27B0'
        };
        break;
    }
  }
  
  update(deltaTime, keys) {
    // Update position based on keyboard input
    if (!this.isDashing && !this.game.transitionState?.active) {
      let moveX = 0;
      let moveY = 0;
      
      if (keys['w'] || keys['ArrowUp']) moveY -= 1;
      if (keys['s'] || keys['ArrowDown']) moveY += 1;
      if (keys['a'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['d'] || keys['ArrowRight']) moveX += 1;
      
      // Normalize diagonal movement
      if (moveX !== 0 && moveY !== 0) {
        const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= magnitude;
        moveY /= magnitude;
      }
      
      this.x += moveX * this.speed * deltaTime;
      this.y += moveY * this.speed * deltaTime;
      
      // Save last movement direction for dash
      if (moveX !== 0 || moveY !== 0) {
        this.dashDirection = { x: moveX, y: moveY };
      }
    } else if (this.isDashing) {
      // Handle dashing
      this.x += this.dashDirection.x * this.dashSpeed * deltaTime;
      this.y += this.dashDirection.y * this.dashSpeed * deltaTime;
      
      this.dashTimer -= deltaTime;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.isInvulnerable = false;
      }
    }
    
    // Keep player within current room bounds if not transitioning
    if (!this.game.transitionState?.active && this.game.currentRoom) {
      const room = this.game.currentRoom;
      this.x = Math.max(room.x + 5, Math.min(room.x + room.width - this.width - 5, this.x));
      this.y = Math.max(room.y + 5, Math.min(room.y + room.height - this.height - 5, this.y));
    }
    
    // Update cooldowns
    if (this.dashCooldown > 0) {
      this.dashCooldown -= deltaTime;
    }
    
    if (this.specialCooldown > 0) {
      this.specialCooldown -= deltaTime;
    }
    
    // Update invulnerability
    if (this.isInvulnerable && !this.isDashing) {
      this.invulnerabilityTimer -= deltaTime;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
    
    // Regenerate energy
    this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * deltaTime);
    
    // Update ability timers
    if (this.isOvercharged || this.isCloaked) {
      this.abilityTimer -= deltaTime;
      if (this.abilityTimer <= 0) {
        this.isOvercharged = false;
        this.isCloaked = false;
      }
    }
  }
  
  render(ctx, cameraX = 0, cameraY = 0) {
    // Apply visual effects for special states
    if (this.isInvulnerable) {
      ctx.globalAlpha = 0.5;
    }
    
    if (this.isCloaked) {
      ctx.globalAlpha = 0.3;
    }
    
    ctx.fillStyle = this.color;
    
    // Draw the player
    ctx.fillRect(
      this.x - cameraX,
      this.y - cameraY,
      this.width,
      this.height
    );
    
    // Draw weapon direction indicator
    const mouse = this.game.mouse || { x: 0, y: 0 };
    const angle = Math.atan2(
      mouse.y - (this.y - cameraY + this.height / 2),
      mouse.x - (this.x - cameraX + this.width / 2)
    );
    
    ctx.save();
    ctx.translate(
      this.x - cameraX + this.width / 2,
      this.y - cameraY + this.height / 2
    );
    ctx.rotate(angle);
    
    // Draw weapon
    ctx.fillStyle = this.weapon.color || '#FFF';
    ctx.fillRect(0, -2, 20, 4);
    
    ctx.restore();
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Visual effects for active abilities
    if (this.isOvercharged) {
      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.x - cameraX - 3,
        this.y - cameraY - 3,
        this.width + 6,
        this.height + 6
      );
    }
  }
  
  dash() {
    if (this.isDashing || this.dashCooldown > 0) return;
    
    this.isDashing = true;
    this.isInvulnerable = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldown = this.dashMaxCooldown;
    
    // Emit dash event
    this.emit('dash-used');
  }
  
  shoot(targetPos) {
    // Check if enough energy
    if (this.energy < this.weapon.energyCost) {
      if (this.game.ui) this.game.ui.showMessage("Not enough energy!", 1000);
      return;
    }
    
    // Calculate angle to target
    const angle = Math.atan2(
      targetPos.y - (this.y - (this.game.camera?.y || 0) + this.height / 2),
      targetPos.x - (this.x - (this.game.camera?.x || 0) + this.width / 2)
    );
    
    // Apply overcharge effect if active
    const damageMultiplier = this.isOvercharged ? 1.5 : 1;
    
    // Create bullet
    const bullet = {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
      width: this.weapon.type === 'beam' ? 30 : 8,
      height: this.weapon.type === 'beam' ? 4 : 8,
      dx: Math.cos(angle) * this.weapon.bulletSpeed,
      dy: Math.sin(angle) * this.weapon.bulletSpeed,
      damage: this.weapon.damage * damageMultiplier,
      color: this.weapon.color,
      fromPlayer: true,
      type: this.weapon.type
    };
    
    if (!this.game.bullets) this.game.bullets = [];
    this.game.bullets.push(bullet);
    
    // Consume energy
    this.energy -= this.weapon.energyCost;
    if (this.game.ui) this.game.ui.updateEnergyBar();
    
    // Emit shot-fired event
    this.emit('shot-fired');
    
    // Special handling for different weapon types
    if (this.weapon.type === 'shotgun') {
      // Create spread shots
      for (let i = 0; i < 4; i++) {
        const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
        const spreadBullet = {
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          width: 8,
          height: 8,
          dx: Math.cos(spreadAngle) * this.weapon.bulletSpeed,
          dy: Math.sin(spreadAngle) * this.weapon.bulletSpeed,
          damage: this.weapon.damage * 0.7 * damageMultiplier,
          color: this.weapon.color,
          fromPlayer: true,
          type: this.weapon.type
        };
        this.game.bullets.push(spreadBullet);
      }
    }
  }
  
  useSpecialAbility() {
    if (this.specialCooldown > 0) {
      if (this.game.ui) this.game.ui.showMessage("Special ability on cooldown!", 1000);
      return;
    }
    
    this.specialCooldown = this.specialMaxCooldown;
    
    switch (this.specialAbility.type) {
      case 'overcharge':
        this.isOvercharged = true;
        this.abilityTimer = 5; // 5 seconds
        if (this.game.ui) this.game.ui.showMessage("Overcharge activated!", 1500);
        break;
      
      case 'shieldBurst':
        // Damage all enemies within radius
        const burstRadius = 150;
        if (this.game.enemies) {
          this.game.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < burstRadius) {
              enemy.takeDamage(30);
              
              // Knockback
              const angle = Math.atan2(dy, dx);
              enemy.x += Math.cos(angle) * 50;
              enemy.y += Math.sin(angle) * 50;
            }
          });
        }
        
        if (this.game.ui) this.game.ui.showMessage("Shield burst activated!", 1500);
        break;
      
      case 'cloaking':
        this.isCloaked = true;
        this.abilityTimer = 3; // 3 seconds
        if (this.game.ui) this.game.ui.showMessage("Cloaking activated!", 1500);
        break;
      
      case 'deployTurret':
        // Create a turret at player position
        const turret = {
          x: this.x + this.width / 2 - 15,
          y: this.y + this.height / 2 - 15,
          width: 30,
          height: 30,
          color: '#795548',
          game: this.game
        };
        
        if (!this.game.turrets) this.game.turrets = [];
        this.game.turrets.push(turret);
        
        if (this.game.ui) this.game.ui.showMessage("Turret deployed!", 1500);
        break;
    }
    
    // Emit ability-used event
    this.emit('ability-used');
  }
  
  takeDamage(amount) {
    if (this.isInvulnerable) return;
    
    this.health -= amount;
    this.health = Math.max(0, this.health);
    
    // Set invulnerability frames
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 0.5; // half second
    
    // Update UI
    if (this.game.ui) this.game.ui.updateHealthBar();
    
    // Emit damage-taken event
    this.emit('damage-taken', amount);
    
    // Check if dead
    if (this.health <= 0) {
      this.emit('player-death');
    }
  }
  
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.game.ui) this.game.ui.updateHealthBar();
  }
  
  rechargeEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    if (this.game.ui) this.game.ui.updateEnergyBar();
  }
  
  // Event system methods
  on(event, callback) {
    this.eventListeners[event] = this.eventListeners[event] || [];
    this.eventListeners[event].push(callback);
  }
  
  emit(event, ...args) {
    const callbacks = this.eventListeners[event] || [];
    callbacks.forEach(callback => callback(...args));
  }
  
  move(x, y, deltaTime) {
    this.x += x * this.speed * deltaTime;
    this.y += y * this.speed * deltaTime;
  }
}

// Minimal Bullet class for compatibility
class Bullet {
  constructor(x, y, dx, dy, damage, color, fromPlayer, type) {
    this.x = x;
    this.y = y;
    this.width = type === 'beam' ? 30 : 8;
    this.height = type === 'beam' ? 4 : 8;
    this.dx = dx;
    this.dy = dy;
    this.damage = damage;
    this.color = color || '#FFF';
    this.fromPlayer = fromPlayer;
    this.type = type || 'standard';
  }
  
  update(deltaTime) {
    this.x += this.dx * deltaTime;
    this.y += this.dy * deltaTime;
  }
  
  render(ctx, cameraX = 0, cameraY = 0) {
    ctx.fillStyle = this.color;
    
    if (this.type === 'beam' || this.type === 'railgun') {
      // Draw a line for beam weapons
      const angle = Math.atan2(this.dy, this.dx);
      
      ctx.save();
      ctx.translate(this.x - cameraX, this.y - cameraY);
      ctx.rotate(angle);
      ctx.fillRect(0, -this.height / 2, this.width, this.height);
      ctx.restore();
    } else {
      // Draw a circle for other bullet types
      ctx.beginPath();
      ctx.arc(this.x - cameraX, this.y - cameraY, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}