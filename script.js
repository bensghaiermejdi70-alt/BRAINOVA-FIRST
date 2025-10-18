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

        // Clear container
        gamesContainer.innerHTML = '';

        // Create game cards safely
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.dataset.id = game.id;
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Ouvrir les détails de ${game.title}`);

            const title = document.createElement('h3');
            title.textContent = game.title;

            const gameInfo = document.createElement('div');
            gameInfo.className = 'game-info';

            const durationBadge = document.createElement('span');
            durationBadge.className = 'info-badge';
            durationBadge.textContent = `⏱️ ${game.duration}`;

            const playersBadge = document.createElement('span');
            playersBadge.className = 'info-badge';
            playersBadge.textContent = `👥 ${game.players}`;

            gameInfo.appendChild(durationBadge);
            gameInfo.appendChild(playersBadge);

            const description = document.createElement('p');
            description.className = 'game-description';
            description.textContent = game.description;

            const categoryBadge = document.createElement('span');
            categoryBadge.className = 'category-badge';
            categoryBadge.textContent = getCategoryLabel(game.category);

            card.appendChild(title);
            card.appendChild(gameInfo);
            card.appendChild(description);
            card.appendChild(categoryBadge);

            // Add click and keyboard event listeners
            const openModal = () => openGameModal(game.id);
            card.addEventListener('click', openModal);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal();
                }
            });

            gamesContainer.appendChild(card);
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

        // Set title safely
        document.getElementById('modal-title').textContent = game.title;
        document.getElementById('modal-duration').textContent = `⏱️ ${game.duration}`;
        document.getElementById('modal-players').textContent = `👥 ${game.players}`;
        document.getElementById('modal-category').textContent = getCategoryLabel(game.category);
        document.getElementById('modal-description').textContent = game.description;

        // Display rules safely
        const rulesContainer = document.getElementById('modal-rules');
        rulesContainer.innerHTML = ''; // Clear first
        
        const rulesTitle = document.createElement('h3');
        rulesTitle.textContent = '📋 Règles du jeu';
        rulesContainer.appendChild(rulesTitle);
        
        const rulesList = document.createElement('ol');
        game.rules.forEach(rule => {
            const li = document.createElement('li');
            li.textContent = rule;
            rulesList.appendChild(li);
        });
        rulesContainer.appendChild(rulesList);

        // Display materials safely
        const materialsContainer = document.getElementById('modal-materials');
        materialsContainer.innerHTML = ''; // Clear first
        
        const materialsTitle = document.createElement('h3');
        materialsTitle.textContent = '🎯 Matériel nécessaire';
        materialsContainer.appendChild(materialsTitle);
        
        const materialsList = document.createElement('ul');
        game.materials.forEach(material => {
            const li = document.createElement('li');
            li.textContent = material;
            materialsList.appendChild(li);
        });
        materialsContainer.appendChild(materialsList);

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        
        // Focus on close button for accessibility
        closeBtn.focus();
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

    // Focus trapping in modal
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab' && modal.style.display === 'block') {
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
});
