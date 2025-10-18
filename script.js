// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    const gamesContainer = document.getElementById('games-container');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const modal = document.getElementById('game-modal');
    const closeBtn = document.querySelector('.close');

    let currentFilter = 'all';
    let currentSearch = '';

    // Initialize: display all games
    displayGames(gamesData);

    // Search functionality
    searchInput.addEventListener('input', function(e) {
        currentSearch = e.target.value.toLowerCase();
        filterAndDisplayGames();
    });

    // Filter functionality
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update filter and display
            currentFilter = this.dataset.category;
            filterAndDisplayGames();
        });
    });

    // Modal functionality
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Filter and display games based on current search and filter
    function filterAndDisplayGames() {
        let filteredGames = gamesData;

        // Apply category filter
        if (currentFilter !== 'all') {
            filteredGames = filteredGames.filter(game => game.category === currentFilter);
        }

        // Apply search filter
        if (currentSearch) {
            filteredGames = filteredGames.filter(game => 
                game.title.toLowerCase().includes(currentSearch) ||
                game.description.toLowerCase().includes(currentSearch)
            );
        }

        displayGames(filteredGames);
    }

    // Display games in the grid
    function displayGames(games) {
        if (games.length === 0) {
            gamesContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: white; font-size: 1.2rem;">Aucun jeu trouvé. Essayez une autre recherche.</p>';
            return;
        }

        gamesContainer.innerHTML = games.map(game => `
            <div class="game-card" data-id="${game.id}">
                <h3>${game.title}</h3>
                <div class="game-info">
                    <span class="info-badge">⏱️ ${game.duration}</span>
                    <span class="info-badge">👥 ${game.players}</span>
                </div>
                <p class="game-description">${game.description}</p>
                <span class="category-badge">${getCategoryLabel(game.category)}</span>
            </div>
        `).join('');

        // Add click event to each card
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', function() {
                const gameId = parseInt(this.dataset.id);
                openGameModal(gameId);
            });
        });
    }

    // Get category label in French
    function getCategoryLabel(category) {
        const labels = {
            'rapide': 'Rapide',
            'groupe': 'Grand Groupe',
            'creatif': 'Créatif',
            'mouvement': 'Mouvement'
        };
        return labels[category] || category;
    }

    // Open modal with game details
    function openGameModal(gameId) {
        const game = gamesData.find(g => g.id === gameId);
        if (!game) return;

        document.getElementById('modal-title').textContent = game.title;
        document.getElementById('modal-duration').textContent = `⏱️ ${game.duration}`;
        document.getElementById('modal-players').textContent = `👥 ${game.players}`;
        document.getElementById('modal-category').textContent = getCategoryLabel(game.category);
        document.getElementById('modal-description').textContent = game.description;

        // Display rules
        const rulesHTML = `
            <h3>📋 Règles du jeu</h3>
            <ol>
                ${game.rules.map(rule => `<li>${rule}</li>`).join('')}
            </ol>
        `;
        document.getElementById('modal-rules').innerHTML = rulesHTML;

        // Display materials
        const materialsHTML = `
            <h3>🎯 Matériel nécessaire</h3>
            <ul>
                ${game.materials.map(material => `<li>${material}</li>`).join('')}
            </ul>
        `;
        document.getElementById('modal-materials').innerHTML = materialsHTML;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    // Close modal
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
});
