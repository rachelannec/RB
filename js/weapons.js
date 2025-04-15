// Weapon types
const WEAPONS = {
    laserRifle: {
      name: 'Laser Rifle',
      damage: 10,
      energyCost: 5,
      bulletSpeed: 500,
      bulletSize: 6,
      bulletColor: '#F44336', // Red
      bulletType: 'single',
      fireRate: 0.1
    },
    plasmaCannon: {
      name: 'Plasma Cannon',
      damage: 25,
      energyCost: 15,
      bulletSpeed: 300,
      bulletSize: 12,
      bulletColor: '#4CAF50', // Green
      bulletType: 'single',
      fireRate: 0.5
    },
    railgun: {
      name: 'Railgun',
      damage: 40,
      energyCost: 25,
      bulletSpeed: 800,
      bulletSize: 4,
      bulletColor: '#2196F3', // Blue
      bulletType: 'single',
      fireRate: 0.8
    },
    beamLaser: {
      name: 'Beam Laser',
      damage: 5,
      energyCost: 2,
      bulletSpeed: 600,
      bulletSize: 3,
      bulletColor: '#FF9800', // Orange
      bulletType: 'beam',
      fireRate: 0.05
    },
    shotgun: {
      name: 'Energy Shotgun',
      damage: 8,
      energyCost: 20,
      bulletSpeed: 400,
      bulletSize: 5,
      bulletColor: '#9C27B0', // Purple
      bulletType: 'shotgun',
      fireRate: 0.6
    }
  };
  
  // Special abilities
  const SPECIAL_ABILITIES = {
    overcharge: {
      name: 'Overcharge',
      description: 'Increases weapon damage by 50% for 5 seconds',
      type: 'overcharge',
      color: '#FF5722'
    },
    shieldBurst: {
      name: 'Shield Burst',
      description: 'Damages all enemies within radius',
      type: 'shieldBurst',
      color: '#FFC107'
    },
    cloaking: {
      name: 'Cloaking',
      description: 'Become nearly invisible for 3 seconds',
      type: 'cloaking',
      color: '#2196F3'
    },
    deployTurret: {
      name: 'Deploy Turret',
      description: 'Deploys a turret that attacks enemies',
      type: 'deployTurret',
      color: '#9C27B0'
    }
  };
  
  // Helper function to get a random weapon
  function getRandomWeapon() {
    const weapons = Object.values(WEAPONS);
    return weapons[Math.floor(Math.random() * weapons.length)];
  }