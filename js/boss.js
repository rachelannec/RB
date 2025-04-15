class CoreGuardian extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.health = 500;
        this.speed = 80;
        this.attackCooldown = 3000;
        this.lastAttack = 0;
    }

    update(time) {
        // Chase player
        this.scene.physics.moveToObject(this, this.scene.player, this.speed);

        // Special attacks
        if (time > this.lastAttack + this.attackCooldown) {
            this.useSpecialAttack();
            this.lastAttack = time;
        }
    }

    useSpecialAttack() {
        const { x, y } = this.scene.player;

        // Phase 1: Laser Beam
        if (this.health > 250) {
            const laser = this.scene.add.rectangle(this.x, this.y, 800, 10, 0xff0000);
            this.scene.physics.add.existing(laser);
            this.scene.tweens.add({
                targets: laser,
                angle: 360,
                duration: 1000,
                onComplete: () => laser.destroy()
            });
        } 
        // Phase 2: Missile Barrage
        else {
            for (let i = 0; i < 8; i++) {
                const missile = this.scene.physics.add.sprite(this.x, this.y, 'missile');
                this.scene.physics.moveTo(missile, x + Phaser.Math.Between(-100, 100), y + Phaser.Math.Between(-100, 100), 200);
            }
        }
    }
}