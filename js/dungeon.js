class Dungeon {
    constructor(config = {}) {
      // Configuration with defaults
      this.config = {
        width: config.width || 50,           // Width of the dungeon grid
        height: config.height || 50,         // Height of the dungeon grid
        roomSizeMin: config.roomSizeMin || 5,  // Minimum room size
        roomSizeMax: config.roomSizeMax || 15, // Maximum room size
        roomCount: config.roomCount || 10,     // Number of rooms to generate
        corridorWidth: config.corridorWidth || 2, // Width of corridors
        biomes: config.biomes || ['Factory', 'Server Core', 'Junkyard'] // Available biomes
      };
      
      // Initialize the dungeon grid
      this.grid = Array(this.config.height).fill().map(() => 
        Array(this.config.width).fill(0)
      );
      
      this.rooms = [];     // Store room information
      this.corridors = []; // Store corridor information
      this.safeRoom = null; // Reference to the starting safe room
    }
    
    // Main method to generate the dungeon
    generate() {
      this.createRooms();
      this.connectRooms();
      this.assignBiomes();
      this.createSafeRoom();
      return {
        grid: this.grid,
        rooms: this.rooms,
        corridors: this.corridors,
        safeRoom: this.safeRoom
      };
    }
    
    // Create random rooms throughout the dungeon
    createRooms() {
      for (let i = 0; i < this.config.roomCount; i++) {
        // Determine room size
        const width = Math.floor(Math.random() * 
          (this.config.roomSizeMax - this.config.roomSizeMin + 1)) + this.config.roomSizeMin;
        const height = Math.floor(Math.random() * 
          (this.config.roomSizeMax - this.config.roomSizeMin + 1)) + this.config.roomSizeMin;
        
        // Find a valid position for the room
        let x, y;
        let valid = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!valid && attempts < maxAttempts) {
          x = Math.floor(Math.random() * (this.config.width - width - 2)) + 1;
          y = Math.floor(Math.random() * (this.config.height - height - 2)) + 1;
          
          valid = this.isValidRoomPosition(x, y, width, height);
          attempts++;
        }
        
        if (valid) {
          // Carve out the room in the grid
          for (let yy = y; yy < y + height; yy++) {
            for (let xx = x; xx < x + width; xx++) {
              this.grid[yy][xx] = 1; // 1 represents a room tile
            }
          }
          
          // Store the room data
          this.rooms.push({
            x,
            y,
            width,
            height,
            center: {
              x: Math.floor(x + width / 2),
              y: Math.floor(y + height / 2)
            },
            connections: [],
            biome: null, // Will be assigned later
            isSafeRoom: false
          });
        }
      }
    }
    
    // Check if a room can be placed at the given position
    isValidRoomPosition(x, y, width, height) {
      // Add a buffer around the room to ensure rooms aren't touching
      const buffer = 2;
      
      for (let yy = y - buffer; yy < y + height + buffer; yy++) {
        for (let xx = x - buffer; xx < x + width + buffer; xx++) {
          // Check if coordinates are within the grid
          if (xx < 0 || yy < 0 || xx >= this.config.width || yy >= this.config.height) {
            return false;
          }
          
          // Check if this position overlaps with an existing room
          if (xx >= x && xx < x + width && yy >= y && yy < y + height) {
            if (this.grid[yy][xx] !== 0) {
              return false;
            }
          }
        }
      }
      
      return true;
    }
    
    // Connect rooms with corridors
    connectRooms() {
      if (this.rooms.length <= 1) return;
      
      // Create a minimum spanning tree to ensure all rooms are connected
      const mst = this.createMinimumSpanningTree();
      
      // For each edge in the MST, create a corridor between the connected rooms
      for (const edge of mst) {
        const roomA = this.rooms[edge.from];
        const roomB = this.rooms[edge.to];
        
        this.createCorridor(roomA, roomB);
        
        // Record the connection
        roomA.connections.push(edge.to);
        roomB.connections.push(edge.from);
      }
      
      // Add a few more corridors to create loops (for better gameplay)
      const additionalCorridors = Math.floor(this.rooms.length * 0.3); // 30% more corridors
      
      for (let i = 0; i < additionalCorridors; i++) {
        const roomA = this.rooms[Math.floor(Math.random() * this.rooms.length)];
        const roomB = this.rooms[Math.floor(Math.random() * this.rooms.length)];
        
        // Don't connect a room to itself or rooms that are already connected
        if (roomA === roomB || roomA.connections.includes(this.rooms.indexOf(roomB))) {
          continue;
        }
        
        this.createCorridor(roomA, roomB);
        
        // Record the connection
        roomA.connections.push(this.rooms.indexOf(roomB));
        roomB.connections.push(this.rooms.indexOf(roomA));
      }
    }
    
    // Create a minimum spanning tree to ensure all rooms are connected
    createMinimumSpanningTree() {
      // Create all possible edges between rooms
      const edges = [];
      
      for (let i = 0; i < this.rooms.length; i++) {
        for (let j = i + 1; j < this.rooms.length; j++) {
          const roomA = this.rooms[i];
          const roomB = this.rooms[j];
          
          // Calculate distance between room centers
          const distance = Math.sqrt(
            Math.pow(roomA.center.x - roomB.center.x, 2) +
            Math.pow(roomA.center.y - roomB.center.y, 2)
          );
          
          edges.push({
            from: i,
            to: j,
            distance
          });
        }
      }
      
      // Sort edges by distance
      edges.sort((a, b) => a.distance - b.distance);
      
      // Kruskal's algorithm to create MST
      const mst = [];
      const disjointSet = Array(this.rooms.length).fill().map((_, i) => i);
      
      function find(x) {
        if (disjointSet[x] !== x) {
          disjointSet[x] = find(disjointSet[x]);
        }
        return disjointSet[x];
      }
      
      function union(x, y) {
        disjointSet[find(x)] = find(y);
      }
      
      for (const edge of edges) {
        if (find(edge.from) !== find(edge.to)) {
          mst.push(edge);
          union(edge.from, edge.to);
        }
        
        // If we have n-1 edges, we have a complete MST
        if (mst.length === this.rooms.length - 1) {
          break;
        }
      }
      
      return mst;
    }
    
    // Create a corridor between two rooms
    createCorridor(roomA, roomB) {
      // Choose random points in each room
      const pointA = {
        x: Math.floor(roomA.x + Math.random() * roomA.width),
        y: Math.floor(roomA.y + Math.random() * roomA.height)
      };
      
      const pointB = {
        x: Math.floor(roomB.x + Math.random() * roomB.width),
        y: Math.floor(roomB.y + Math.random() * roomB.height)
      };
      
      // Create an L-shaped corridor (horizontal then vertical)
      const corridorData = {
        points: [
          { x: pointA.x, y: pointA.y },
          { x: pointB.x, y: pointA.y },
          { x: pointB.x, y: pointB.y }
        ],
        width: this.config.corridorWidth
      };
      
      // Carve the corridor in the grid
      this.carveHorizontalCorridor(pointA.x, pointB.x, pointA.y);
      this.carveVerticalCorridor(pointA.y, pointB.y, pointB.x);
      
      this.corridors.push(corridorData);
    }
    
    // Carve a horizontal corridor in the grid
    carveHorizontalCorridor(x1, x2, y) {
      const startX = Math.min(x1, x2);
      const endX = Math.max(x1, x2);
      
      for (let halfWidth = 0; halfWidth < Math.floor(this.config.corridorWidth / 2) + 1; halfWidth++) {
        for (let x = startX; x <= endX; x++) {
          if (y + halfWidth >= 0 && y + halfWidth < this.config.height) {
            this.grid[y + halfWidth][x] = 2; // 2 represents a corridor tile
          }
          if (y - halfWidth >= 0 && y - halfWidth < this.config.height && halfWidth > 0) {
            this.grid[y - halfWidth][x] = 2;
          }
        }
      }
    }
    
    // Carve a vertical corridor in the grid
    carveVerticalCorridor(y1, y2, x) {
      const startY = Math.min(y1, y2);
      const endY = Math.max(y1, y2);
      
      for (let halfWidth = 0; halfWidth < Math.floor(this.config.corridorWidth / 2) + 1; halfWidth++) {
        for (let y = startY; y <= endY; y++) {
          if (x + halfWidth >= 0 && x + halfWidth < this.config.width) {
            this.grid[y][x + halfWidth] = 2;
          }
          if (x - halfWidth >= 0 && x - halfWidth < this.config.width && halfWidth > 0) {
            this.grid[y][x - halfWidth] = 2;
          }
        }
      }
    }
    
    // Assign biomes to different sections of the dungeon
    assignBiomes() {
      // Divide the dungeon into regions and assign biomes
      const regionWidth = Math.ceil(this.config.width / this.config.biomes.length);
      
      for (const room of this.rooms) {
        // Determine which region this room belongs to
        const regionIndex = Math.min(
          Math.floor(room.center.x / regionWidth),
          this.config.biomes.length - 1
        );
        
        room.biome = this.config.biomes[regionIndex];
      }
    }
    
    // Create a special safe room for the player to start in
    createSafeRoom() {
      if (this.rooms.length === 0) return;
      
      // Find a room with few connections and mark it as the safe room
      const sortedRooms = [...this.rooms].sort((a, b) => a.connections.length - b.connections.length);
      const safeRoom = sortedRooms[0]; // Room with fewest connections
      
      safeRoom.isSafeRoom = true;
      safeRoom.biome = 'Safe Zone'; // Special biome for the safe room
      
      this.safeRoom = safeRoom;
    }
    
    // Place enemies in the dungeon based on room biome and size
    placeEnemies() {
      const enemies = [];
      
      for (let i = 0; i < this.rooms.length; i++) {
        const room = this.rooms[i];
        
        // No enemies in the safe room
        if (room.isSafeRoom) continue;
        
        // Number of enemies scales with room size
        const enemyCount = Math.floor((room.width * room.height) / 20);
        
        for (let j = 0; j < enemyCount; j++) {
          // Random position within the room
          const x = Math.floor(room.x + Math.random() * room.width);
          const y = Math.floor(room.y + Math.random() * room.height);
          
          // Determine enemy type based on biome
          let enemyType;
          switch (room.biome) {
            case 'Factory':
              enemyType = Math.random() < 0.7 ? 'Scout Drone' : 'Heavy Sentry';
              break;
            case 'Server Core':
              enemyType = Math.random() < 0.6 ? 'Sniper Bot' : 'Scout Drone';
              break;
            case 'Junkyard':
              enemyType = Math.random() < 0.8 ? 'Heavy Sentry' : 'Sniper Bot';
              break;
            default:
              enemyType = 'Scout Drone';
          }
          
          enemies.push({
            x,
            y,
            type: enemyType,
            roomIndex: i
          });
        }
      }
      
      return enemies;
    }
    
    // Place loot and power-ups in the dungeon
    placeLoot() {
      const loot = [];
      
      // Chance for each room to have loot
      for (let i = 0; i < this.rooms.length; i++) {
        const room = this.rooms[i];
        
        // Guaranteed loot in safe room
        if (room.isSafeRoom) {
          loot.push({
            x: Math.floor(room.x + room.width / 2),
            y: Math.floor(room.y + room.height / 2),
            type: 'Health Pack',
            roomIndex: i
          });
          continue;
        }
        
        // Random chance for loot in other rooms
        if (Math.random() < 0.7) { // 70% chance for loot
          const x = Math.floor(room.x + Math.random() * room.width);
          const y = Math.floor(room.y + Math.random() * room.height);
          
          // Determine loot type
          const lootTypes = ['Health Pack', 'Energy Cell', 'Weapon Upgrade', 'Shield Boost'];
          const lootType = lootTypes[Math.floor(Math.random() * lootTypes.length)];
          
          loot.push({
            x,
            y,
            type: lootType,
            roomIndex: i
          });
        }
      }
      
      return loot;
    }
    
    // Place a boss in one of the furthest rooms from the safe room
    placeBoss() {
      if (this.rooms.length <= 1 || !this.safeRoom) return null;
      
      // Find the furthest room from the safe room
      const safeRoomIndex = this.rooms.indexOf(this.safeRoom);
      let furthestRoom = null;
      let maxDistance = 0;
      
      for (let i = 0; i < this.rooms.length; i++) {
        if (i === safeRoomIndex) continue;
        
        const room = this.rooms[i];
        const distance = Math.sqrt(
          Math.pow(room.center.x - this.safeRoom.center.x, 2) +
          Math.pow(room.center.y - this.safeRoom.center.y, 2)
        );
        
        if (distance > maxDistance) {
          maxDistance = distance;
          furthestRoom = room;
        }
      }
      
      if (furthestRoom) {
        furthestRoom.isBossRoom = true;
        
        // Randomly select a boss
        const bosses = ['Core Guardian', 'Nano Swarm Queen'];
        const bossType = bosses[Math.floor(Math.random() * bosses.length)];
        
        return {
          x: Math.floor(furthestRoom.x + furthestRoom.width / 2),
          y: Math.floor(furthestRoom.y + furthestRoom.height / 2),
          type: bossType,
          roomIndex: this.rooms.indexOf(furthestRoom)
        };
      }
      
      return null;
    }
  }
  
  // Export the Dungeon class
  export default Dungeon;