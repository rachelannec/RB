// API base URL - change this when you deploy your server
const API_BASE_URL = 'http://localhost:3000/api';

// Get leaderboard with backward compatibility
async function getLeaderboard() {
  console.log('Fetching leaderboard from:', `${API_BASE_URL}/leaderboard`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    console.log('Leaderboard response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Failed to fetch leaderboard: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    // Handle both new paginated format and old array format
    const scores = data.data || data;
    console.log(`Leaderboard data received: ${scores.length} entries`);
    return scores;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

// Get leaderboard with pagination and filtering options
async function getLeaderboardPaginated(options = {}) {
  const { page = 1, limit = 10, robotType, sortBy = 'score', sortDir = 'desc' } = options;
  
  let url = `${API_BASE_URL}/leaderboard?page=${page}&limit=${limit}&sortBy=${sortBy}&sortDir=${sortDir}`;
  
  if (robotType) {
    url += `&robotType=${encodeURIComponent(robotType)}`;
  }
  
  console.log('Fetching paginated leaderboard from:', url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch leaderboard: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Leaderboard data received: ${data.totalEntries} total entries, showing page ${data.page}/${data.totalPages}`);
    return data;
  } catch (error) {
    console.error('Error getting paginated leaderboard:', error);
    return { data: [], totalEntries: 0, page: 1, totalPages: 0 };
  }
}

// Save score to leaderboard with better error handling and validation
async function saveScore(playerName, score, wavesCleared, robotType) {
  console.log('Saving score:', { playerName, score, wavesCleared, robotType });
  
  // Client-side validation
  if (score === undefined || score === null) {
    console.error('Invalid score value');
    return false;
  }
  
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
    
    // Log the raw response for debugging
    console.log('Server response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`Failed to save score: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Score saved successfully:', data);
    return {
      success: true,
      scoreId: data.scoreId
    };
  } catch (error) {
    console.error('Error saving score:', error);
    alert(`Failed to save score: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get individual score details with improved error handling
async function getScoreDetails(scoreId) {
  try {
    if (!scoreId) {
      console.error('Invalid score ID provided');
      return null;
    }
    
    console.log(`Fetching score details for ID: ${scoreId}`);
    const response = await fetch(`${API_BASE_URL}/scores/${scoreId}`);
    
    if (response.status === 404) {
      console.warn(`Score ID ${scoreId} not found`);
      return null;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch score details: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Score details retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error getting score details:', error);
    return null;
  }
}

// Get all individual scores with filtering and pagination
async function getAllScores(options = {}) {
  const { page = 1, limit = 10, robotType, sortBy = 'timestamp', sortDir = 'desc' } = options;
  
  let url = `${API_BASE_URL}/scores?page=${page}&limit=${limit}&sortBy=${sortBy}&sortDir=${sortDir}`;
  
  if (robotType) {
    url += `&robotType=${encodeURIComponent(robotType)}`;
  }
  
  console.log('Fetching all score files from:', url);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch scores: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Score data received: ${data.totalEntries} total entries, showing page ${data.page}/${data.totalPages}`);
    return data;
  } catch (error) {
    console.error('Error getting score files:', error);
    return { data: [], totalEntries: 0, page: 1, totalPages: 0 };
  }
}

// Get score statistics
async function getScoreStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/scores/stats`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch score statistics: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting score statistics:', error);
    return {
      totalScores: 0,
      highestScore: 0,
      averageScore: 0,
      robotTypes: {}
    };
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
      const errorText = await response.text();
      throw new Error(`Failed to save game state: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      savedAt: data.savedAt
    };
  } catch (error) {
    console.error('Error saving game state:', error);
    return {
      success: false,
      error: error.message
    };
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
      const errorText = await response.text();
      throw new Error(`Failed to load game state: ${response.status} ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}

// List all player saves
async function listPlayerSaves(playerId) {
  try {
    let url = `${API_BASE_URL}/saves`;
    if (playerId) {
      url += `?playerId=${encodeURIComponent(playerId)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list saves: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error listing saves:', error);
    return {
      total: 0,
      saves: []
    };
  }
}