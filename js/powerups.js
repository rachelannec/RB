// Base PowerUp class
class PowerUp {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 20;
      this.height = 20;
      this.color = '#FFFFFF';
    }
    
    render(ctx, cameraX, cameraY) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2 - cameraX,
        this.y + this.height / 2 - cameraY,
        this.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // Add pulsating effect
      const pulseSize = 3 * Math.sin(Date.now() / 200) + 3;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        this.x + this.width / 2 - cameraX,
        this.y + this.height / 2 - cameraY,
        this.width / 2 + pulseSize,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    
    apply(player) {
      // Override in subclasses
    }
  }
  
  // Health Pack
  class HealthPack extends PowerUp {
    constructor(x, y) {
      super(x, y);
      this.color = '#4CAF50'; // Green
      this.amount = 30;
    }
    
    apply(player) {
      player.heal(this.amount);
    }
    
    render(ctx, cameraX, cameraY) {
      super.render(ctx, cameraX, cameraY);
      
      // Draw the "+" symbol
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.rect(
        this.x + this.width / 2 - 1 - cameraX,
        this.y + this.height / 4 - cameraY,
        2,
        this.height / 2
      );
      ctx.rect(
        this.x + this.width / 4 - cameraX,
        this.y + this.height / 2 - 1 - cameraY,
        this.width / 2,
        2
      );
      ctx.fill();
    }
  }
  
  // Energy Cell
  class EnergyCell extends PowerUp {
    constructor(x, y) {
      super(x, y);
      this.color = '#2196F3'; // Blue
      this.amount = 50;
    }
    
    apply(player) {
      player.rechargeEnergy(this.amount);
    }
    
    render(ctx, cameraX, cameraY) {
      super.render(ctx, cameraX, cameraY);
      
      // Draw lightning bolt symbol
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      const centerX = this.x + this.width / 2 - cameraX;
      const centerY = this.y + this.height / 2 - cameraY;
      ctx.moveTo(centerX - 3, centerY - 5);
      ctx.lineTo(centerX + 2, centerY - 1);
      ctx.lineTo(centerX - 1, centerY + 1);
      ctx.lineTo(centerX + 3, centerY + 5);
      ctx.lineTo(centerX - 2, centerY + 1);
      ctx.lineTo(centerX + 1, centerY - 1);
      ctx.closePath();
      ctx.fill();
    }
  }
  
  // Weapon Upgrade
  class WeaponUpgrade extends PowerUp {
    constructor(x, y, weapon) {
      super(x, y);
      this.color = '#FF9800'; // Orange
      this.weapon = weapon;
    }
    
    apply(player) {
      player.weapon = this.weapon;
    }
    
    render(ctx, cameraX, cameraY) {
      super.render(ctx, cameraX, cameraY);
      
      // Draw weapon symbol (crosshair)
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const centerX = this.x + this.width / 2 - cameraX;
      const centerY = this.y + this.height / 2 - cameraY;
      ctx.moveTo(centerX - 5, centerY);
      ctx.lineTo(centerX + 5, centerY);
      ctx.moveTo(centerX, centerY - 5);
      ctx.lineTo(centerX, centerY + 5);
      ctx.stroke();
      
      // Draw small circle in center
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }