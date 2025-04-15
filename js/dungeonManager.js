// dungeonManager.js
import Dungeon from './dungeon.js';

// Create and initialize the dungeon
export function generateDungeon(config = {}) {
  const dungeon = new Dungeon(config);
  const dungeonData = dungeon.generate();
  
  // Generate gameplay elements
  const enemies = dungeon.placeEnemies();
  const loot = dungeon.placeLoot();
  const boss = dungeon.placeBoss();
  
  return {
    grid: dungeonData.grid,
    rooms: dungeonData.rooms,
    corridors: dungeonData.corridors,
    safeRoom: dungeonData.safeRoom,
    enemies,
    loot,
    boss
  };
}

// Get player starting position
export function getPlayerStartPosition(dungeonData) {
  if (!dungeonData.safeRoom) {
    // Fallback to first room if no safe room
    const firstRoom = dungeonData.rooms[0];
    return {
      x: firstRoom.x + Math.floor(firstRoom.width / 2),
      y: firstRoom.y + Math.floor(firstRoom.height / 2)
    };
  }
  
  return {
    x: dungeonData.safeRoom.x + Math.floor(dungeonData.safeRoom.width / 2),
    y: dungeonData.safeRoom.y + Math.floor(dungeonData.safeRoom.height / 2)
  };
}

// Get room by position
export function getRoomAtPosition(x, y, dungeonData) {
  for (let i = 0; i < dungeonData.rooms.length; i++) {
    const room = dungeonData.rooms[i];
    if (x >= room.x && x < room.x + room.width &&
        y >= room.y && y < room.y + room.height) {
      return { room, index: i };
    }
  }
  return null;
}

// Get enemies in a specific room
export function getEnemiesInRoom(roomIndex, dungeonData) {
  return dungeonData.enemies.filter(enemy => enemy.roomIndex === roomIndex);
}

// Get loot in a specific room
export function getLootInRoom(roomIndex, dungeonData) {
  return dungeonData.loot.filter(item => item.roomIndex === roomIndex);
}