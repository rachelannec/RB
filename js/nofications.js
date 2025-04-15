class NotificationSystem {
    constructor(game) {
      this.game = game;
      this.messages = [];
    }
    
    show(text, duration = 2000, color = '#FFC107') {
      const message = {
        text,
        duration,
        color,
        timeLeft: duration
      };
      
      this.messages.push(message);
      this.createMessageElement(message);
    }
    
    createMessageElement(message) {
      const container = document.getElementById('message-container');
      const element = document.createElement('div');
      element.className = 'game-message';
      element.textContent = message.text;
      element.style.color = message.color;
      container.appendChild(element);
      
      // Remove after duration
      setTimeout(() => {
        element.classList.add('fade-out');
        setTimeout(() => element.remove(), 500);
      }, message.duration);
    }
    
    update(deltaTime) {
      // Update existing messages
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const message = this.messages[i];
        message.timeLeft -= deltaTime * 1000;
        
        if (message.timeLeft <= 0) {
          this.messages.splice(i, 1);
        }
      }
    }
  }
  
  class DamageNumberSystem {
    constructor(game) {
      this.game = game;
      this.damageNumbers = [];
    }
    
    add(amount, x, y, color = '#FFFFFF') {
      this.damageNumbers.push({
        amount,
        x,
        y,
        color,
        velocity: { x: Math.random() * 2 - 1, y: -2 },
        lifetime: 1.0
      });
    }
    
    update(deltaTime) {
      for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
        const number = this.damageNumbers[i];
        
        // Update position
        number.x += number.velocity.x;
        number.y += number.velocity.y;
        
        // Decrease lifetime
        number.lifetime -= deltaTime;
        
        // Remove if expired
        if (number.lifetime <= 0) {
          this.damageNumbers.splice(i, 1);
        }
      }
    }
    
    render(ctx, cameraX, cameraY) {
      ctx.save();
      
      this.damageNumbers.forEach(number => {
        const alpha = Math.min(1, number.lifetime * 2);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = number.color;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          Math.round(number.amount),
          number.x - cameraX,
          number.y - cameraY
        );
      });
      
      ctx.restore();
    }
  }
  
  class TutorialSystem {
    constructor(game) {
      this.game = game;
      this.steps = [
        { message: "Use WASD or Arrow keys to move", delay: 1000 },
        { message: "Click to shoot", delay: 5000 },
        { message: "Press SPACE to dash", delay: 10000 }
      ];
      this.currentStep = 0;
      this.active = false;
    }
    
    start() {
      this.active = true;
      this.showCurrentStep();
    }
    
    showCurrentStep() {
      if (!this.active || this.currentStep >= this.steps.length) return;
      
      const step = this.steps[this.currentStep];
      this.game.notificationSystem.show(step.message, 3000);
      this.currentStep++;
      
      setTimeout(() => this.showCurrentStep(), step.delay);
    }
  }