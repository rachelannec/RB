document.addEventListener('DOMContentLoaded', () => {
    console.log('Leaderboard module loaded');
    
    // Load leaderboard data when the page loads
    loadLeaderboard();
    
    // Function to load and display leaderboard data
    function loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) {
            console.error('Leaderboard list element not found');
            return;
        }
        
        leaderboardList.innerHTML = '<li class="loading">Loading scores...</li>';
        
        // Add a delay to ensure the server is ready
        setTimeout(() => {
            console.log('Fetching leaderboard data...');
            getLeaderboard()
                .then(scores => {
                    console.log('Leaderboard data received:', scores);
                    if (scores && Array.isArray(scores) && scores.length > 0) {
                        leaderboardList.innerHTML = '';
                        scores.slice(0, 30).forEach((entry, index) => {
                            const li = document.createElement('li');
                            const rank = index + 1;
                            const robotEmoji = getRobotEmoji(entry.robotType);
                            
                            li.innerHTML = `
                                <span class="rank">${rank}</span>
                                <span class="player-name">${entry.playerName || 'Anonymous'}</span>
                                <span class="robot-type">${robotEmoji}</span>
                                <span class="score">${entry.score.toLocaleString()}</span>
                                <span class="waves">Wave: ${entry.wavesCleared || 0}</span>
                            `;
                            leaderboardList.appendChild(li);
                        });
                    } else {
                        console.log('No scores found or invalid data format', scores);
                        leaderboardList.innerHTML = '<li class="loading">No scores yet. Be the first!</li>';
                    }
                })
                .catch(error => {
                    console.error('Error loading leaderboard:', error);
                    leaderboardList.innerHTML = '<li class="loading">Error loading scores. Server might be offline.</li>';
                });
        }, 1000); // Give the server a second to initialize
    }
    
    // New function to load and display recent scores from individual score files
    function loadRecentScores() {
        const recentScoresList = document.getElementById('recent-scores-list');
        if (!recentScoresList) {
            console.error('Recent scores list element not found');
            return;
        }
        
        recentScoresList.innerHTML = '<li class="loading">Loading recent scores...</li>';
        
        // Get all scores sorted by timestamp (newest first)
        getAllScores({ limit: 20, sortBy: 'timestamp', sortDir: 'desc' })
            .then(response => {
                console.log('Recent scores data received:', response);
                const scores = response.data;
                
                if (scores && Array.isArray(scores) && scores.length > 0) {
                    recentScoresList.innerHTML = '';
                    scores.forEach((entry) => {
                        const li = document.createElement('li');
                        const robotEmoji = getRobotEmoji(entry.robotType);
                        const date = new Date(entry.timestamp);
                        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                        
                        li.innerHTML = `
                            <span class="player-name">${entry.playerName || 'Anonymous'}</span>
                            <span class="robot-type">${robotEmoji}</span>
                            <span class="score">${entry.score.toLocaleString()}</span>
                            <span class="waves">Wave: ${entry.wavesCleared || 0}</span>
                            <span class="timestamp">${formattedDate}</span>
                        `;
                        recentScoresList.appendChild(li);
                    });
                } else {
                    recentScoresList.innerHTML = '<li class="loading">No recent scores found</li>';
                }
            })
            .catch(error => {
                console.error('Error loading recent scores:', error);
                recentScoresList.innerHTML = '<li class="loading">Error loading scores. Server might be offline.</li>';
            });
    }
    
    // Helper function to get emoji for robot type
    function getRobotEmoji(robotType) {
        switch (robotType) {
            case 'assault': return '🔫';
            case 'tank': return '🛡️';
            case 'stealth': return '👾';
            default: return '🤖';
        }
    }
    
    // Add event listeners
    const viewRecentScoresBtn = document.getElementById('view-recent-scores');
    if (viewRecentScoresBtn) {
        viewRecentScoresBtn.addEventListener('click', () => {
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('recent-scores').classList.remove('hidden');
            loadRecentScores();
        });
    }
    
    const backToMenuBtn = document.getElementById('back-to-menu');
    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            document.getElementById('recent-scores').classList.add('hidden');
            document.getElementById('start-screen').classList.remove('hidden');
        });
    }
    
    // Make functions globally available
    window.loadLeaderboard = loadLeaderboard;
    window.loadRecentScores = loadRecentScores;
});