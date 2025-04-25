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

// OSS Client configuration
function createOSSClient() {
  return new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
  });
}

// API Routes
// Get leaderboard data
app.get('/api/leaderboard', async (req, res) => {
  try {
    const client = createOSSClient();
    
    try {
      const result = await client.get('leaderboard.json');
      const leaderboardData = JSON.parse(result.content.toString());
      res.json(leaderboardData);
    } catch (error) {
      // If file doesn't exist yet, return empty array
      if (error.code === 'NoSuchKey') {
        res.json([]);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

// Save score to leaderboard
app.post('/api/scores', async (req, res) => {
  try {
    const { playerName, score, wavesCleared, robotType } = req.body;
    
    if (!playerName || score === undefined || wavesCleared === undefined || !robotType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const client = createOSSClient();
    const timestamp = new Date().toISOString();
    
    // Get existing leaderboard
    let existingData = [];
    try {
      const result = await client.get('leaderboard.json');
      existingData = JSON.parse(result.content.toString());
    } catch (error) {
      if (error.code !== 'NoSuchKey') {
        throw error;
      }
      // If file doesn't exist, we'll create it with the new score
    }
    
    // Add new score
    existingData.push({
      playerName,
      score,
      wavesCleared,
      robotType,
      timestamp
    });
    
    // Sort by score (descending)
    existingData.sort((a, b) => b.score - a.score);
    
    // Keep only top 100 scores
    const topScores = existingData.slice(0, 100);
    
    // Save back to OSS
    await client.put('leaderboard.json', Buffer.from(JSON.stringify(topScores)));
    
    res.status(201).json({ message: 'Score saved successfully' });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// Save game state
app.post('/api/save', async (req, res) => {
  try {
    const { playerId, gameState } = req.body;
    
    if (!playerId || !gameState) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const client = createOSSClient();
    await client.put(`saves/${playerId}.json`, Buffer.from(JSON.stringify(gameState)));
    
    res.status(201).json({ message: 'Game state saved successfully' });
  } catch (error) {
    console.error('Error saving game state:', error);
    res.status(500).json({ error: 'Failed to save game state' });
  }
});

// Load game state
app.get('/api/save/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const client = createOSSClient();
    
    try {
      const result = await client.get(`saves/${playerId}.json`);
      const gameState = JSON.parse(result.content.toString());
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
    res.status(500).json({ error: 'Failed to load game state' });
  }
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    endpoints: [
      '/api/leaderboard',
      '/api/scores',
      '/api/save/:playerId'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});