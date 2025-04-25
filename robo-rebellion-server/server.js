console.log("Starting server...");

const express = require('express');
const cors = require('cors');
const OSS = require('ali-oss');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log("Environment loaded:", {
  region: process.env.OSS_REGION,
  bucket: process.env.OSS_BUCKET,
  // Don't log secrets in production!
  hasAccessKey: !!process.env.OSS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.OSS_ACCESS_KEY_SECRET
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Add debugging middleware to log all requests
app.use((req, res, next) => {
  // Only log the body for POST/PUT requests that actually have a body
  if (['POST', 'PUT'].includes(req.method)) {
    console.log(`${req.method} request to ${req.path}`, req.body);
  } else {
    console.log(`${req.method} request to ${req.path}`);
  }
  next();
});

// OSS Client configuration
function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
    endpoint: process.env.OSS_ENDPOINT, 
    secure: true // Use HTTPS
  });
}

// API Routes
// Get leaderboard data with pagination and filtering
app.get('/api/leaderboard', async (req, res) => {
  console.log('Fetching leaderboard data...');
  try {
    // Parse query parameters
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const robotType = req.query.robotType; // Optional filter by robot type
    const sortBy = req.query.sortBy || 'score'; // Default sort by score
    const sortDir = req.query.sortDir || 'desc'; // Default descending order
    
    console.log(`Query params: limit=${limit}, page=${page}, robotType=${robotType}, sort=${sortBy}:${sortDir}`);
    
    const client = createOSSClient();
    
    try {
      console.log('Getting leaderboard.json from OSS...');
      const result = await client.get('leaderboard.json');
      let leaderboardData = JSON.parse(result.content.toString());
      
      // Apply filters if specified
      if (robotType) {
        leaderboardData = leaderboardData.filter(entry => entry.robotType === robotType);
      }
      
      // Apply sorting
      leaderboardData.sort((a, b) => {
        let comparison = 0;
        
        // Handle different sort fields
        if (sortBy === 'score') {
          comparison = a.score - b.score;
        } else if (sortBy === 'wavesCleared') {
          comparison = a.wavesCleared - b.wavesCleared;
        } else if (sortBy === 'timestamp') {
          comparison = new Date(a.timestamp) - new Date(b.timestamp);
        }
        
        // Apply direction
        return sortDir === 'desc' ? -comparison : comparison;
      });
      
      // Calculate pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedData = leaderboardData.slice(startIndex, endIndex);
      
      console.log(`Leaderboard data retrieved: ${leaderboardData.length} total entries, returning ${paginatedData.length} entries`);
      
      // Return paginated data with metadata
      res.json({
        totalEntries: leaderboardData.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(leaderboardData.length / limit),
        data: paginatedData
      });
    } catch (error) {
      console.log('Error getting leaderboard file:', error.code, error.message);
      
      // If file doesn't exist yet, create it and return empty array
      if (error.code === 'NoSuchKey') {
        console.log('Leaderboard file not found, creating empty one...');
        try {
          await client.put('leaderboard.json', Buffer.from(JSON.stringify([])));
          console.log('Empty leaderboard file created');
          res.json({
            totalEntries: 0,
            page: 1,
            limit: limit,
            totalPages: 0,
            data: []
          });
        } catch (putError) {
          console.error('Error creating leaderboard file:', putError);
          throw putError;
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard data', 
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Get score statistics and summaries
app.get('/api/scores/stats', async (req, res) => {
  try {
    console.log('Generating score statistics...');
    const client = createOSSClient();
    
    try {
      const result = await client.get('leaderboard.json');
      const leaderboardData = JSON.parse(result.content.toString());
      
      if (!leaderboardData || leaderboardData.length === 0) {
        return res.json({
          totalScores: 0,
          highestScore: 0,
          averageScore: 0,
          robotTypes: {}
        });
      }
      
      // Calculate statistics
      const totalScores = leaderboardData.length;
      const highestScore = Math.max(...leaderboardData.map(entry => entry.score));
      const averageScore = Math.round(
        leaderboardData.reduce((sum, entry) => sum + entry.score, 0) / totalScores
      );
      
      // Count scores by robot type
      const robotTypes = leaderboardData.reduce((counts, entry) => {
        const type = entry.robotType || 'unknown';
        counts[type] = (counts[type] || 0) + 1;
        return counts;
      }, {});
      
      // Calculate highest wave cleared
      const highestWave = Math.max(...leaderboardData.map(entry => entry.wavesCleared || 0));
      
      res.json({
        totalScores,
        highestScore,
        averageScore,
        highestWave,
        robotTypes,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.log('Error getting leaderboard for stats:', error.code, error.message);
      
      if (error.code === 'NoSuchKey') {
        res.json({
          totalScores: 0,
          highestScore: 0,
          averageScore: 0,
          highestWave: 0,
          robotTypes: {},
          lastUpdated: new Date().toISOString()
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error generating statistics:', error);
    res.status(500).json({
      error: 'Failed to generate statistics',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// NEW ENDPOINT: List all scores in the scores folder
app.get('/api/scores', async (req, res) => {
  try {
    console.log('Listing all individual score files...');
    
    // Get query parameters for filtering and pagination
    const limit = parseInt(req.query.limit) || 100;
    const page = parseInt(req.query.page) || 1;
    const robotType = req.query.robotType;
    const sortBy = req.query.sortBy || 'timestamp';
    const sortDir = req.query.sortDir || 'desc';
    
    const client = createOSSClient();
    
    // List all files in the scores directory
    const result = await client.list({
      prefix: 'scores/',
      'max-keys': 1000
    });
    
    if (!result.objects || result.objects.length === 0) {
      return res.json({
        totalEntries: 0,
        page: 1,
        limit,
        totalPages: 0,
        data: []
      });
    }
    
    // Filter out directory marker files and collect actual score files
    let scoreFiles = result.objects
      .filter(obj => obj.name.startsWith('scores/') && 
               obj.name !== 'scores/' && 
               obj.name !== 'scores/.keep' && 
               obj.name.endsWith('.json'));
    
    console.log(`Found ${scoreFiles.length} score files`);
    
    // Fetch actual score data for each file
    let scoreDetailsPromises = scoreFiles.map(async (file) => {
      try {
        const scoreResult = await client.get(file.name);
        const scoreData = JSON.parse(scoreResult.content.toString());
        
        // Extract the score ID from the filename
        const scoreId = file.name.split('/')[1].split('_')[0];
        
        return {
          ...scoreData,
          id: scoreId,
          filename: file.name,
          lastModified: file.lastModified
        };
      } catch (error) {
        console.error(`Error fetching score from ${file.name}:`, error);
        return null;
      }
    });
    
    // Wait for all scores to be fetched
    let allScores = await Promise.all(scoreDetailsPromises);
    
    // Filter out any failed fetches
    allScores = allScores.filter(score => score !== null);
    
    // Apply robot type filtering if specified
    if (robotType) {
      allScores = allScores.filter(score => score.robotType === robotType);
    }
    
    // Sort the scores
    allScores.sort((a, b) => {
      let comparison = 0;
      
      // Handle different sort fields
      if (sortBy === 'score') {
        comparison = a.score - b.score;
      } else if (sortBy === 'wavesCleared') {
        comparison = a.wavesCleared - b.wavesCleared;
      } else if (sortBy === 'timestamp') {
        comparison = new Date(a.timestamp) - new Date(b.timestamp);
      } else if (sortBy === 'lastModified') {
        comparison = new Date(a.lastModified) - new Date(b.lastModified);
      }
      
      // Apply direction
      return sortDir === 'desc' ? -comparison : comparison;
    });
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedScores = allScores.slice(startIndex, endIndex);
    
    res.json({
      totalEntries: allScores.length,
      page: page,
      limit: limit,
      totalPages: Math.ceil(allScores.length / limit),
      data: paginatedScores
    });
  } catch (error) {
    console.error('Error listing score files:', error);
    res.status(500).json({
      error: 'Failed to list scores',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Get individual score details by ID (must come after specific routes like /stats)
app.get('/api/scores/:scoreId', async (req, res) => {
  try {
    const { scoreId } = req.params;
    
    if (!scoreId || scoreId.includes('..')) {
      return res.status(400).json({ error: 'Invalid score ID' });
    }
    
    console.log(`Fetching individual score: ${scoreId}`);
    const client = createOSSClient();
    
    // Try to find the score file based on ID pattern
    try {
      // List scores directory to find files that match the ID
      const result = await client.list({
        prefix: `scores/${scoreId}`,
        'max-keys': 10
      });
      
      if (!result.objects || result.objects.length === 0) {
        return res.status(404).json({ error: 'Score not found' });
      }
      
      // Find the file that contains the scoreId in its name
      const scoreFile = result.objects.find(obj => obj.name.includes(scoreId));
      
      if (!scoreFile) {
        return res.status(404).json({ error: 'Score not found' });
      }
      
      // Retrieve the score data
      const scoreResult = await client.get(scoreFile.name);
      const scoreData = JSON.parse(scoreResult.content.toString());
      
      res.json({
        ...scoreData,
        id: scoreId,
        filename: scoreFile.name
      });
    } catch (error) {
      console.error('Error retrieving score:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error getting individual score:', error);
    res.status(500).json({
      error: 'Failed to retrieve score',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Save score to leaderboard
app.post('/api/scores', async (req, res) => {
  try {
    console.log('Received score data:', req.body);
    
    // Validate required fields
    const { playerName, score, wavesCleared, robotType } = req.body;
    
    if (score === undefined || score === null) {
      return res.status(400).json({ error: 'Score is required' });
    }
    
    // Validate score is a number
    const numericScore = Number(score);
    if (isNaN(numericScore)) {
      return res.status(400).json({ error: 'Score must be a valid number' });
    }
    
    // Validate wavesCleared is a number
    const numericWaves = Number(wavesCleared || 0);
    if (isNaN(numericWaves)) {
      return res.status(400).json({ error: 'Waves cleared must be a valid number' });
    }
    
    // Sanitize player name (prevent injection, limit length)
    const sanitizedName = (playerName || 'Anonymous')
      .trim()
      .replace(/[^\w\s-]/g, '')  // Remove special characters
      .substring(0, 15);         // Limit length
    
    // Validate robot type
    const validRobotTypes = ['assault', 'tank', 'stealth', 'unknown'];
    const validatedRobotType = validRobotTypes.includes(robotType) ? robotType : 'unknown';
    
    // Create score object with validated data
    const scoreData = {
      playerName: sanitizedName,
      score: numericScore,
      wavesCleared: numericWaves,
      robotType: validatedRobotType,
      timestamp: new Date().toISOString()
    };
    
    console.log('Saving validated score:', scoreData);
    
    const client = createOSSClient();
    
    // Save individual score file with a more structured filename
    const scoreId = Date.now();
    const scoreFile = `scores/${scoreId}_${validatedRobotType}_${numericScore}.json`;
    await client.put(scoreFile, Buffer.from(JSON.stringify(scoreData)));
    
    // Update leaderboard with the new score
    try {
      // Get existing leaderboard
      const result = await client.get('leaderboard.json');
      const leaderboard = JSON.parse(result.content.toString());
      
      // Add new score
      leaderboard.push(scoreData);
      
      // Sort by score (highest first)
      leaderboard.sort((a, b) => b.score - a.score);
      
      // Keep top 100 scores
      const topScores = leaderboard.slice(0, 100);
      
      // Save back to OSS
      await client.put('leaderboard.json', Buffer.from(JSON.stringify(topScores)));
      console.log('Leaderboard updated with new score');
      
      res.status(201).json({ 
        message: 'Score saved successfully',
        debug: 'Updated leaderboard with new score',
        scoreId: scoreId
      });
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      
      // Still return success since the individual score was saved
      res.status(201).json({ 
        message: 'Score saved partially',
        debug: 'Saved individual score but failed to update leaderboard',
        scoreId: scoreId
      });
    }
  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Failed to save score',
      details: error.message,
      code: error.code
    });
  }
});

// Save game state
app.post('/api/save', async (req, res) => {
  try {
    const { playerId, gameState } = req.body;
    
    // Validate required fields
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }
    
    if (!gameState) {
      return res.status(400).json({ error: 'Game state is required' });
    }
    
    // Sanitize playerId to prevent path traversal
    const sanitizedPlayerId = playerId
      .toString()
      .replace(/[^\w-]/g, '')
      .substring(0, 36); // Limit length
    
    // Validate game state has required properties
    if (typeof gameState !== 'object') {
      return res.status(400).json({ error: 'Game state must be an object' });
    }
    
    // Add metadata to game state
    const enrichedGameState = {
      ...gameState,
      savedAt: new Date().toISOString(),
      playerId: sanitizedPlayerId
    };
    
    const client = createOSSClient();
    await client.put(`saves/${sanitizedPlayerId}.json`, Buffer.from(JSON.stringify(enrichedGameState)));
    
    res.status(201).json({ 
      message: 'Game state saved successfully',
      playerId: sanitizedPlayerId,
      savedAt: enrichedGameState.savedAt
    });
  } catch (error) {
    console.error('Error saving game state:', error);
    res.status(500).json({ 
      error: 'Failed to save game state',
      details: error.message
    });
  }
});

// Load game state
app.get('/api/save/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Sanitize playerId to prevent path traversal
    const sanitizedPlayerId = playerId
      .toString()
      .replace(/[^\w-]/g, '')
      .substring(0, 36); // Limit length
    
    const client = createOSSClient();
    
    try {
      const result = await client.get(`saves/${sanitizedPlayerId}.json`);
      const gameState = JSON.parse(result.content.toString());
      
      // Add last loaded timestamp
      gameState.lastLoaded = new Date().toISOString();
      
      res.json(gameState);
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        res.status(404).json({ error: 'No saved game found' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error loading game state:', error);
    res.status(500).json({ 
      error: 'Failed to load game state',
      details: error.message
    });
  }
});

// Get all player saves (for administrators or for a player to see all their saves)
app.get('/api/saves', async (req, res) => {
  try {
    const playerId = req.query.playerId; // Optional filter for a specific player's saves
    const client = createOSSClient();
    
    // List all save files
    const result = await client.list({
      prefix: 'saves/',
      'max-keys': 1000
    });
    
    if (!result.objects || result.objects.length === 0) {
      return res.json({
        total: 0,
        saves: []
      });
    }
    
    // Filter and map results
    let saves = result.objects
      .filter(obj => obj.name.startsWith('saves/') && obj.name !== 'saves/')
      .map(obj => ({
        filename: obj.name,
        playerId: obj.name.replace('saves/', '').replace('.json', ''),
        lastModified: obj.lastModified
      }));
    
    // Filter by playerId if specified
    if (playerId) {
      const sanitizedPlayerId = playerId.toString().replace(/[^\w-]/g, '');
      saves = saves.filter(save => save.playerId === sanitizedPlayerId);
    }
    
    res.json({
      total: saves.length,
      saves: saves
    });
  } catch (error) {
    console.error('Error listing saves:', error);
    res.status(500).json({
      error: 'Failed to list saves',
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    endpoints: [
      '/api/leaderboard',
      '/api/scores',
      '/api/scores/:scoreId',
      '/api/scores/stats',
      '/api/save/:playerId',
      '/api/saves'
    ]
  });
});

// Comprehensive OSS test endpoint
app.get('/api/test-oss', async (req, res) => {
  try {
    // Test basic connectivity
    console.log("Testing OSS connectivity...");
    
    // 1. Create client and log configuration
    const config = {
      region: process.env.OSS_REGION,
      bucket: process.env.OSS_BUCKET,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID ? "PROVIDED" : "MISSING",
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET ? "PROVIDED" : "MISSING"
    };
    console.log("OSS configuration:", config);
    
    const client = createOSSClient();
    
    // 2. Try to list objects (simplest operation)
    console.log("Listing bucket objects...");
    const listResult = await client.list({
      'max-keys': 10
    });
    
    console.log("List operation successful:", {
      objects: listResult.objects ? listResult.objects.length : 0,
      prefixes: listResult.prefixes
    });
    
    // 3. Try to write a simple test file
    const testContent = JSON.stringify({
      test: 'data',
      timestamp: new Date().toISOString()
    });
    
    console.log("Writing test file...");
    const putResult = await client.put('test-connection.json', Buffer.from(testContent));
    
    console.log("Write operation successful:", {
      url: putResult.url,
      name: putResult.name
    });
    
    // Return full diagnostic information
    res.json({
      success: true,
      message: 'All OSS operations successful',
      config: {
        region: process.env.OSS_REGION,
        bucket: process.env.OSS_BUCKET
      },
      operations: {
        list: "SUCCESS",
        write: "SUCCESS"
      }
    });
  } catch (error) {
    console.error('OSS test failed:', {
      message: error.message,
      code: error.code,
      name: error.name,
      requestId: error.requestId,
      host: error.host
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      requestId: error.requestId,
      config: {
        region: process.env.OSS_REGION,
        bucket: process.env.OSS_BUCKET
      }
    });
  }
});

// Initialize empty leaderboard if it doesn't exist
async function initializeLeaderboard() {
  try {
    const client = createOSSClient();
    
    // Check if leaderboard.json exists
    try {
      const result = await client.head('leaderboard.json');
      console.log('Leaderboard file already exists, checking format...');
      
      // Validate leaderboard format
      try {
        const leaderboardResult = await client.get('leaderboard.json');
        const leaderboard = JSON.parse(leaderboardResult.content.toString());
        
        if (!Array.isArray(leaderboard)) {
          console.warn('Leaderboard is not an array, recreating...');
          await client.put('leaderboard.json', Buffer.from(JSON.stringify([])));
          console.log('Empty leaderboard file created');
        } else {
          console.log(`Existing leaderboard has ${leaderboard.length} entries`);
        }
      } catch (parseError) {
        console.error('Error parsing leaderboard, recreating:', parseError);
        await client.put('leaderboard.json', Buffer.from(JSON.stringify([])));
        console.log('Empty leaderboard file created due to parsing error');
      }
      
    } catch (error) {
      // If file doesn't exist, create an empty leaderboard
      if (error.code === 'NoSuchKey') {
        console.log('Creating empty leaderboard file...');
        await client.put('leaderboard.json', Buffer.from(JSON.stringify([])));
        console.log('Empty leaderboard file created');
      } else {
        throw error;
      }
    }
    
    // Ensure scores directory exists
    try {
      console.log('Ensuring scores directory exists...');
      // OSS doesn't need explicit directory creation,
      // but we can place a marker file to ensure the path exists
      await client.put('scores/.keep', Buffer.from(''));
      console.log('Scores directory verified');
    } catch (error) {
      console.error('Error checking scores directory:', error);
    }
    
    // Ensure saves directory exists
    try {
      console.log('Ensuring saves directory exists...');
      await client.put('saves/.keep', Buffer.from(''));
      console.log('Saves directory verified');
    } catch (error) {
      console.error('Error checking saves directory:', error);
    }
  } catch (error) {
    console.error('Error initializing leaderboard:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await initializeLeaderboard();
    console.log('Leaderboard initialization complete!');
  } catch (error) {
    console.error('Initialization error:', error);
  }
});