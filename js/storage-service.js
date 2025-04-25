// API base URL - change this when you deploy your server
const API_BASE_URL = 'http://localhost:3000/api';

// Get leaderboard data
async function getLeaderboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// Save score to leaderboard
async function saveScore(playerName, score, wavesCleared, robotType) {
  try {
    const response = await fetch(`${API_BASE_URL}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName,
        score,
        wavesCleared,
        robotType
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save score');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving score:', error);
    return false;
  }
}

// Save game state
async function saveGameState(playerId, gameState) {
  try {
    const response = await fetch(`${API_BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId,
        gameState
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save game state');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    return false;
  }
}

// Load game state
async function loadGameState(playerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/save/${playerId}`);
    if (response.status === 404) {
      return null; // No saved game found
    }
    if (!response.ok) {
      throw new Error('Failed to load game state');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}
