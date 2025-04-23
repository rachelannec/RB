// about the developers and stuffs
// const devInfo = {
//     gameTitle: "Robo Rebellion",
//     version: "1.0.0",
//     description: "A top-down robot shooter with multiple playable robot types. Fight against waves of enemy bots and survive as long as possible!",
//     developers: [
//       "Rachel Anne Cilon"



//     ],
//     year: "2025",
//     credits: [
//       { role: "Game Design", name: "Your Name" },
//       { role: "Programming", name: "Your Name" },
//       { role: "Art & Animation", name: "Your Name" }
//     ],
//     controls: [
//       { action: "Move", keys: "W, A, S, D or Arrow Keys" },
//       { action: "Aim", keys: "Mouse" },
//       { action: "Shoot", keys: "Left Mouse Button" },
//       { action: "Dash", keys: "Space" },
//       { action: "Pause", keys: "Escape" }
//     ],
//     website: "https://yourwebsite.com",
//     social: {
//       twitter: "@yourhandle",
//       github: "yourusername"
//     }
//   };

// Info panel functionality

document.addEventListener('DOMContentLoaded', function () {
    const infoTab = document.getElementById('info-tab');
    const infoPanel = document.getElementById('info-panel');
    const closePanel = document.getElementById('close-info-panel');
  
    // Open the info panel
    infoTab.addEventListener('click', function () {
      infoPanel.classList.add('info-panel-visible');
    });
  
    // Close the info panel
    closePanel.addEventListener('click', function () {
      infoPanel.classList.remove('info-panel-visible');
    });
  
    // Close the info panel when pressing the ESC key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && infoPanel.classList.contains('info-panel-visible')) {
        infoPanel.classList.remove('info-panel-visible');
      }
    });
  
    // Hide the info tab when the game is playing
    const gameCheckInterval = setInterval(() => {
      if (window.roboRebellion) {
        const gameState = window.roboRebellion.state;
        if (gameState === 'playing') {
          document.body.classList.add('playing');
        } else {
          document.body.classList.remove('playing');
        }
      }
    }, 300); // Check every 300ms
  });
