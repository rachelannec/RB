class GameUI {
  constructor(scene) {
      this.scene = scene;
      this.game = scene.game;
      this.createHealthBar();
      this.createEnergyBar();
      this.createWeaponDisplay();
      this.createScoreDisplay();
      this.createMessageSystem();
  }

  // ========================
  // Core UI Elements
  // ========================

  createHealthBar() {
      // Background
      this.healthBarBg = this.scene.add.rectangle(100, 20, 200, 20, 0x333333)
          .setOrigin(0, 0.5)
          .setScrollFactor(0);

      // Fill
      this.healthBarFill = this.scene.add.rectangle(100, 20, 200, 20, 0xff0000)
          .setOrigin(0, 0.5)
          .setScrollFactor(0);

      // Text
      this.healthText = this.scene.add.text(210, 20, '100/100', { 
          fontSize: '16px', 
          fill: '#ffffff',
          fontFamily: 'Arial'
      }).setOrigin(0, 0.5).setScrollFactor(0);
  }

  createEnergyBar() {
      // Background
      this.energyBarBg = this.scene.add.rectangle(100, 45, 200, 10, 0x333333)
          .setOrigin(0, 0.5)
          .setScrollFactor(0);

      // Fill (blue with glow effect)
      this.energyBarFill = this.scene.add.rectangle(100, 45, 200, 10, 0x00aaff)
          .setOrigin(0, 0.5)
          .setScrollFactor(0);

      // Add glow effect
      this.scene.tweens.add({
          targets: this.energyBarFill,
          alpha: 0.7,
          duration: 1000,
          yoyo: true,
          repeat: -1
      });
  }

  // ========================
  // Dynamic UI Updates
  // ========================

  updateHealth() {
      const healthPercent = this.scene.player.health / this.scene.player.maxHealth;
      const newWidth = 200 * healthPercent;
      
      // Animate health decrease
      this.scene.tweens.add({
          targets: this.healthBarFill,
          width: newWidth,
          duration: 200,
          ease: 'Power1'
      });

      // Color change based on health
      if (healthPercent < 0.3) {
          this.healthBarFill.setFillStyle(0xff3300); // Red when critical
      } else if (healthPercent < 0.6) {
          this.healthBarFill.setFillStyle(0xff9900); // Orange when low
      } else {
          this.healthBarFill.setFillStyle(0x00ff00); // Green when healthy
      }

      // Update text
      this.healthText.setText(`${Math.floor(this.scene.player.health)}/${this.scene.player.maxHealth}`);
  }

  updateEnergy() {
      const energyPercent = this.scene.player.energy / this.scene.player.maxEnergy;
      this.energyBarFill.width = 200 * energyPercent;
  }

  // ========================
  // Special UI Effects
  // ========================

  showDamageEffect() {
      // Screen flash on damage
      const overlay = this.scene.add.rectangle(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height, 0xff0000)
          .setOrigin(0)
          .setAlpha(0)
          .setScrollFactor(0)
          .setDepth(1000);

      this.scene.tweens.add({
          targets: overlay,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
          onComplete: () => overlay.destroy()
      });
  }

  showMessage(text, duration = 2000) {
      const message = this.scene.add.text(
          this.scene.cameras.main.centerX,
          100,
          text,
          {
              fontSize: '24px',
              fill: '#ffffff',
              backgroundColor: '#000000',
              padding: { x: 10, y: 5 },
              stroke: '#ff00ff',
              strokeThickness: 2
          }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000);

      // Animate message
      this.scene.tweens.add({
          targets: message,
          y: 80,
          alpha: 0,
          delay: duration,
          duration: 500,
          onComplete: () => message.destroy()
      });
  }

  // ========================
  // Weapon UI
  // ========================

  createWeaponDisplay() {
      this.weaponDisplay = this.scene.add.container(700, 30);
      
      // Weapon icon
      this.weaponIcon = this.scene.add.sprite(0, 0, 'weapon_icons')
          .setFrame(0)
          .setScale(1.5);
      
      // Ammo text
      this.ammoText = this.scene.add.text(30, 0, 'Pistol\n∞', {
          fontSize: '14px',
          fill: '#ffffff',
          align: 'left'
      }).setOrigin(0, 0.5);

      this.weaponDisplay.add([this.weaponIcon, this.ammoText]);
      this.weaponDisplay.setScrollFactor(0);
  }

  updateWeaponDisplay() {
      const weapon = this.scene.player.currentWeapon;
      this.weaponIcon.setFrame(weapon.iconFrame);
      
      const ammoText = weapon.ammo === Infinity ? 
          `${weapon.name}\n∞` : 
          `${weapon.name}\n${weapon.ammo}/${weapon.maxAmmo}`;
      
      this.ammoText.setText(ammoText);
  }

  // ========================
  // Cooldown Indicators
  // ========================

  createCooldownIndicators() {
      // Dash cooldown (circular)
      this.dashCooldown = this.scene.add.graphics()
          .setScrollFactor(0)
          .setPosition(50, 550)
          .setDepth(10);
      
      // Special ability cooldown
      this.specialCooldown = this.scene.add.graphics()
          .setScrollFactor(0)
          .setPosition(750, 550)
          .setDepth(10);
  }

  updateDashCooldown(percent) {
      this.dashCooldown.clear();
      if (percent < 1) {
          this.dashCooldown.fillStyle(0xffffff, 0.5);
          this.dashCooldown.beginPath();
          this.dashCooldown.arc(0, 0, 20, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * percent));
          this.dashCooldown.lineTo(0, 0);
          this.dashCooldown.fillPath();
      }
  }
}