document.addEventListener('DOMContentLoaded', () => {
    // Button to view leaderboard
    const viewLeaderboardBtn = document.getElementById('view-leaderboard');
    const backToMenuBtn = document.getElementById('back-to-menu');
    const startScreen = document.getElementById('start-screen');
    const leaderboardScreen = document.getElementById('leaderboard');

    // Show leaderboard when button is clicked
    viewLeaderboardBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        leaderboardScreen.classList.remove('hidden');
        loadLeaderboard();
    });

    // Return to menu
    backToMenuBtn.addEventListener('click', () => {
        leaderboardScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });

    // Load and display leaderboard data
    function loadLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '<li class="loading">Loading scores...</li>';
        
        getLeaderboard()
            .then(scores => {
                if (scores && scores.length > 0) {
                    leaderboardList.innerHTML = '';
                    scores.slice(0, 10).forEach((entry, index) => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <span class="rank">#${index + 1}</span>
                            <span class="name">${entry.playerName}</span>
                            <span class="score">${entry.score}</span>
                            <span class="waves">${entry.wavesCleared} waves</span>`;
                        leaderboardList.appendChild(li);
                    });
                } else {
                    leaderboardList.innerHTML = '<li>No scores yet. Be the first!</li>';
                }
            })
            .catch(error => {
                console.error('Error loading leaderboard:', error);
                leaderboardList.innerHTML = '<li>Error loading scores. Please try again.</li>';
            });
    }
});