// Base Enemy class
class Enemy {
    constructor(x, y, game) {
      this.x = x;
      this.y = y;
      this.width = 30;
      this.height = 30;
      this.health = 20;
      this.maxHealth = 20;
      this.speed = 100;
      this.color = '#F44336';
      this.game = game;
      this.contactDamage = 10;
      this.points = 100;
      this.shootCooldown = 0;
    }
    
    update(deltaTime, player) {
      // Move towards player
      const dx = player.x + player.width / 2 - (this.x + this.width / 2);
      const dy = player.y + player.height / 2 - (this.y + this.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only move if not too close to player
      if (distance > 100) {
        this.x += (dx / distance) * this.speed * deltaTime;
        this.y += (dy / distance) * this.speed * deltaTime;
      }
      
      // Keep enemy within room bounds
      const room = this.game.currentRoom;
      this.x = Math.max(room.x + 10, Math.min(room.x + room.width - this.width - 10, this.x));
      this.y = Math.max(room.y + 10, Math.min(room.y + room.height - this.height - 10, this.y));
    }
    
    render(ctx, cameraX, cameraY) {
      // Draw enemy
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - cameraX, this.y - cameraY, this.width, this.height);
      
      // Draw health bar
      const healthPercentage = this.health / this.maxHealth;
      const barWidth = this.width;
      const barHeight = 5;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x - cameraX, this.y - cameraY - barHeight - 2, barWidth, barHeight);
      
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(this.x - cameraX, this.y - cameraY - barHeight - 2, barWidth * healthPercentage, barHeight);
    }
    
    takeDamage(amount) {
      this.health -= amount;
    }
  }
  
  // Scout Drone - Fast but weak
  class ScoutDrone extends Enemy {
    constructor(x, y, game) {
      super(x, y, game);
      this.width = 25;
      this.height = 25;
      this.health = 15;
      this.maxHealth = 15;
      this.speed = 150;
      this.color = '#F44336'; // Red
      this.contactDamage = 5;
      this.points = 50;
    }
  }
  
  // Heavy Sentry - Slow but tough
  class HeavySentry extends Enemy {
    constructor(x, y, game) {
      super(x, y, game);
      this.width = 40;
      this.height = 40;
      this.health = 50;
      this.maxHealth = 50;
      this.speed = 80;
      this.color = '#FFC107'; // Yellow
      this.contactDamage = 15;
      this.points = 150;
    }
  }
  
  // Sniper Bot - Attacks from a distance
  class SniperBot extends Enemy {
    constructor(x, y, game) {
      super(x, y, game);
      this.width = 30;
      this.height = 30;
      this.health = 25;
      this.maxHealth = 25;
      this.speed = 100;
      this.color = '#2196F3'; // Blue
      this.contactDamage = 8;
      this.points = 100;
      this.shootCooldown = 0;
      this.maxShootCooldown = 2; // Seconds
    }
    
    update(deltaTime, player) {
      // Keep distance from player
      const dx = player.x + player.width / 2 - (this.x + this.width / 2);
      const dy = player.y + player.height / 2 - (this.y + this.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 200) {
        // Too close, move away from player
        this.x -= (dx / distance) * this.speed * deltaTime;
        this.y -= (dy / distance) * this.speed * deltaTime;
      } else if (distance > 300) {
        // Too far, move closer to player
        this.x += (dx / distance) * this.speed * deltaTime * 0.5;
        this.y += (dy / distance) * this.speed * deltaTime * 0.5;
      }
      
      // Keep enemy within room bounds
      const room = this.game.currentRoom;
      this.x = Math.max(room.x + 10, Math.min(room.x + room.width - this.width - 10, this.x));
      this.y = Math.max(room.y + 10, Math.min(room.y + room.height - this.height - 10, this.y));
      
      // Shoot at player
      this.shootCooldown -= deltaTime;
      if (this.shootCooldown <= 0 && distance < 400) {
        this.shoot(player);
        this.shootCooldown = this.maxShootCooldown;
      }
    }
    
    shoot(player) {
      const angle = Math.atan2(
        player.y + player.height / 2 - (this.y + this.height / 2),
        player.x + player.width / 2 - (this.x + this.width / 2)
      );
      
      this.game.bullets.push(
        new Bullet(
          this.x + this.width / 2,
          this.y + this.height / 2,
          angle,
          400,
          10,
          6,
          '#00BCD4', // Cyan for enemy bullets
          false
        )
      );
    }
  }
  
  // Turret (deployed by Engineer Bot)
  class Turret extends Enemy {
    constructor(x, y, game) {
      super(x, y, game);
      this.width = 25;
      this.height = 25;
      this.health = 30;
      this.maxHealth = 30;
      this.speed = 0; // Doesn't move
      this.color = '#9C27B0'; // Purple
      this.contactDamage = 0;
      this.points = 0; // Doesn't give points when destroyed
      this.shootCooldown = 0;
      this.maxShootCooldown = 0.5; // Seconds
      this.lifetime = 10; // Seconds
      this.isFriendly = true;
    }
    
    update(deltaTime, player) {
      // Find closest enemy
      let closestEnemy = null;
      let closestDistance = Infinity;
      
      this.game.enemies.forEach(enemy => {
        if (enemy !== this && !enemy.isFriendly) {
          const dx = enemy.x + enemy.width / 2 - (this.x + this.width / 2);
          const dy = enemy.y + enemy.height / 2 - (this.y + this.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
          }
        }
      });
      
      // Shoot at closest enemy
      this.shootCooldown -= deltaTime;
      if (this.shootCooldown <= 0 && closestEnemy && closestDistance < 300) {
        this.shootAt(closestEnemy);
        this.shootCooldown = this.maxShootCooldown;
      }
      
      // Decrement lifetime
      this.lifetime -= deltaTime;
      if (this.lifetime <= 0) {
        // Remove from game
        const index = this.game.enemies.indexOf(this);
        if (index !== -1) {
          this.game.enemies.splice(index, 1);
        }
      }
    }
    
    shootAt(target) {
      const angle = Math.atan2(
        target.y + target.height / 2 - (this.y + this.height / 2),
        target.x + target.width / 2 - (this.x + this.width / 2)
      );
      
      this.game.bullets.push(
        new Bullet(
          this.x + this.width / 2,
          this.y + this.height / 2,
          angle,
          400,
          8,
          6,
          '#9C27B0', // Purple bullets for turret
          true // Counts as player bullet so it hurts enemies
        )
      );
    }
  }