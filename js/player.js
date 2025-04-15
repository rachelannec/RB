// Player Class
class Player {
    constructor(x, y, type, game) {
      this.x = x;
      this.y = y;
      this.width = 40;
      this.height = 40;
      this.type = type;
      this.game = game;
      
      // Initialize based on robot type
      switch (type) {
        case 'assault':
          this.color = '#4CAF50';
          this.maxHealth = 100;
          this.health = 100;
          this.maxEnergy = 100;
          this.energy = 100;
          this.energyRegenRate = 10;
          this.speed = 200;
          this.weapon = WEAPONS.laserRifle;
          this.specialAbility = SPECIAL_ABILITIES.overcharge;
          break;
        case 'tank':
          this.color = '#FFC107';
          this.maxHealth = 150;
          this.health = 150;
          this.maxEnergy = 80;
          this.energy = 80;
          this.energyRegenRate = 8;
          this.speed = 150;
          this.weapon = WEAPONS.plasmaCannon;
          this.specialAbility = SPECIAL_ABILITIES.shieldBurst;
          break;
        case 'stealth':
          this.color = '#2196F3';
          this.maxHealth = 80;
          this.health = 80;
          this.maxEnergy = 120;
          this.energy = 120;
          this.energyRegenRate = 15;
          this.speed = 250;
          this.weapon = WEAPONS.railgun;
          this.specialAbility = SPECIAL_ABILITIES.cloaking;
          break;
        case 'engineer':
          this.color = '#9C27B0';
          this.maxHealth = 90;
          this.health = 90;
          this.maxEnergy = 150;
          this.energy = 150;
          this.energyRegenRate = 12;
          this.speed = 180;
          this.weapon = WEAPONS.beamLaser;
          this.specialAbility = SPECIAL_ABILITIES.deployTurret;
          break;
      }
      
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
    }
    
    update(deltaTime, keys) {
      // Update position based on keyboard input
      if (!this.isDashing) {
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
      } else {
        // Handle dashing
        this.x += this.dashDirection.x * this.dashSpeed * deltaTime;
        this.y += this.dashDirection.y * this.dashSpeed * deltaTime;
        
        this.dashTimer -= deltaTime;
        if (this.dashTimer <= 0) {
          this.isDashing = false;
        }
      }
      
      // Keep player within current room bounds
      const room = this.game.currentRoom;
      this.x = Math.max(room.x + 10, Math.min(room.x + room.width - this.width - 10, this.x));
      this.y = Math.max(room.y + 10, Math.min(room.y + room.height - this.height - 10, this.y));
      
      // Update dash cooldown
      if (this.dashCooldown > 0) {
        this.dashCooldown -= deltaTime;
      }
      
      // Update special ability cooldown
      if (this.specialCooldown > 0) {
        this.specialCooldown -= deltaTime;
      }
      
      // Update invulnerability timer
      if (this.isInvulnerable) {
        this.invulnerabilityTimer -= deltaTime;
        if (this.invulnerabilityTimer <= 0) {
          this.isInvulnerable = false;
        }
      }
      
      // Update ability timer
      if (this.isOvercharged || this.isCloaked) {
        this.abilityTimer -= deltaTime;
        if (this.abilityTimer <= 0) {
          this.isOvercharged = false;
          this.isCloaked = false;
        }
      }
      
      // Regenerate energy
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * deltaTime);
      this.game.ui.updateEnergyBar();
    }
    
    render(ctx, cameraX, cameraY) {
      // Draw the player
      ctx.fillStyle = this.color;
      
      // Flashing effect during invulnerability
      if (this.isInvulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      
      // Apply cloak effect
      if (this.isCloaked) {
        ctx.globalAlpha = 0.3;
      }
      
      ctx.fillRect(this.x - cameraX, this.y - cameraY, this.width, this.height);
      
      // Reset opacity
      ctx.globalAlpha = 1.0;
      
      // Draw weapon direction (aim line)
      const mouseX = this.game.mouse.x + cameraX;
      const mouseY = this.game.mouse.y + cameraY;
      
      const angle = Math.atan2(
        mouseY - (this.y + this.height / 2),
        mouseX - (this.x + this.width / 2)
      );
      
      const playerCenterX = this.x + this.width / 2 - cameraX;
      const playerCenterY = this.y + this.height / 2 - cameraY;
      
      ctx.strokeStyle = this.isOvercharged ? '#FF5722' : '#FFC107';
      ctx.lineWidth = this.isOvercharged ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(playerCenterX, playerCenterY);
      ctx.lineTo(
        playerCenterX + Math.cos(angle) * 30,
        playerCenterY + Math.sin(angle) * 30
      );
      ctx.stroke();
    }
    
    shoot(target) {
      if (this.energy < this.weapon.energyCost) return;
      
      this.energy -= this.weapon.energyCost;
      this.game.ui.updateEnergyBar();
      
      const angle = Math.atan2(
        target.y + this.game.currentRoom.y - this.y - this.height / 2,
        target.x + this.game.currentRoom.x - this.x - this.width / 2
      );
      
      // Apply overcharge effect if active
      const damageMultiplier = this.isOvercharged ? 1.5 : 1;
      
      // Create bullet based on weapon type
      if (this.weapon.bulletType === 'single') {
        this.game.bullets.push(
          new Bullet(
            this.x + this.width / 2,
            this.y + this.height / 2,
            angle,
            this.weapon.bulletSpeed,
            this.weapon.damage * damageMultiplier,
            this.weapon.bulletSize,
            this.weapon.bulletColor,
            true
          )
        );
      } else if (this.weapon.bulletType === 'shotgun') {
        // Create multiple bullets with spread
        for (let i = 0; i < 5; i++) {
          const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
          this.game.bullets.push(
            new Bullet(
              this.x + this.width / 2,
              this.y + this.height / 2,
              spreadAngle,
              this.weapon.bulletSpeed * (0.8 + Math.random() * 0.4),
              this.weapon.damage * damageMultiplier / 2,
              this.weapon.bulletSize,
              this.weapon.bulletColor,
              true
            )
          );
        }
      } else if (this.weapon.bulletType === 'beam') {
        // Create a straight line of bullets for beam effect
        for (let i = 1; i <= 10; i++) {
          this.game.bullets.push(
            new Bullet(
              this.x + this.width / 2 + Math.cos(angle) * i * 15,
              this.y + this.height / 2 + Math.sin(angle) * i * 15,
              angle,
              this.weapon.bulletSpeed,
              this.weapon.damage * damageMultiplier / 5,
              this.weapon.bulletSize,
              this.weapon.bulletColor,
              true,
              0.1 // Short lifetime for beam bullets
            )
          );
        }
      }
    }
    
    dash() {
      if (this.dashCooldown <= 0 && !this.isDashing) {
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.dashCooldown = this.dashMaxCooldown;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = this.dashDuration;
      }
    }
    
    useSpecialAbility() {
      if (this.specialCooldown <= 0) {
        this.specialCooldown = this.specialMaxCooldown;
        
        switch (this.specialAbility.type) {
          case 'overcharge':
            this.isOvercharged = true;
            this.abilityTimer = 5; // 5 seconds of overcharge
            break;
          case 'shieldBurst':
            // Damage all enemies within radius
            const burstRadius = 150;
            this.game.enemies.forEach(enemy => {
              const dx = enemy.x + enemy.width / 2 - (this.x + this.width / 2);
              const dy = enemy.y + enemy.height / 2 - (this.y + this.height / 2);
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < burstRadius) {
                enemy.takeDamage(30);
              }
            });
            break;
          case 'cloaking':
            this.isCloaked = true;
            this.abilityTimer = 3; // 3 seconds of cloaking
            break;
          case 'deployTurret':
            // Create a new turret enemy that targets other enemies
            const turret = new Turret(
              this.x + this.width / 2,
              this.y + this.height / 2,
              this.game
            );
            this.game.enemies.push(turret);
            break;
        }
      }
    }
    
    takeDamage(amount) {
      if (this.isInvulnerable || this.isCloaked) return;
      
      this.health -= amount;
      // Trigger invulnerability frames
      this.isInvulnerable = true;
      this.invulnerabilityTimer = 0.5; // 0.5 seconds of invulnerability
    }
    
    heal(amount) {
      this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    rechargeEnergy(amount) {
      this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }
  }
  
  // Bullet class
  class Bullet {
    constructor(x, y, angle, speed, damage, size, color, fromPlayer, lifetime = 2) {
      this.x = x;
      this.y = y;
      this.angle = angle;
      this.speed = speed;
      this.damage = damage;
      this.width = size;
      this.height = size;
      this.color = color;
      this.fromPlayer = fromPlayer;
      this.lifetime = lifetime; // In seconds
    }
    
    update(deltaTime) {
      this.x += Math.cos(this.angle) * this.speed * deltaTime;
      this.y += Math.sin(this.angle) * this.speed * deltaTime;
      
      this.lifetime -= deltaTime;
    }
    
    render(ctx, cameraX, cameraY) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(
        this.x - cameraX,
        this.y - cameraY,
        this.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }