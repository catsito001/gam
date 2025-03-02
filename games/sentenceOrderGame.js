export class SentenceOrderGame {
    constructor(gameData, gamesManager) {
        this.gameData = gameData;
        this.gamesManager = gamesManager;
        this.sentences = gameData.sentences;
        this.currentSentenceIndex = 0;
        this.currentSentenceWords = [];
        this.score = 0;
        this.draggedItem = null;
    }

    init() {
        this.createUI();
        this.loadSentence();
    }

    createUI() {
        const container = document.createElement('div');
        container.className = 'game-container order-game';
        container.innerHTML = `
            <style>
                .game-container.order-game {
                    background: linear-gradient(135deg, #2980b9, #6dd5fa);
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    font-family: 'Arial', sans-serif;
                    color: #ecf0f1;
                }
                .game-container.order-game .game-instructions {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .game-container.order-game .game-instructions h3 {
                    margin-bottom: 10px;
                }
                .game-container.order-game .score span {
                    font-weight: bold;
                    color: #ffffff;
                }
                .game-container.order-game .exercise-counter span {
                    font-weight: bold;
                    color: #f1c40f;
                }
                .word-container, .drop-zone, .action-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    margin-bottom: 20px;
                }
                /* Para que las palabras en la drop-zone queden pegadas */
                .drop-zone {
                    gap: 0 !important;
                    justify-content: flex-start !important;
                }
                .drop-zone .word-box {
                    margin: 0; /* Sin margen entre palabras */
                }
                .word-box {
                    background-color: #ffffff;
                    border: 2px solid #3498db;
                    border-radius: 5px;
                    padding: 10px 15px;
                    font-size: 1.2rem;
                    color: #2c3e50;
                    cursor: pointer;
                    user-select: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .word-box.dragging {
                    opacity: 0.5;
                }
                .drop-zone {
                    min-height: 80px;
                    border: 2px dashed #2980b9;
                    border-radius: 5px;
                    background-color: rgba(41, 128, 185, 0.1);
                    align-items: center;
                }
                .action-buttons button {
                    background-color: #3498db;
                    border: none;
                    color: #fff;
                    padding: 10px 20px;
                    font-size: 1rem;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                .action-buttons button:hover {
                    background-color: #2980b9;
                }
            </style>
            <div class="game-instructions">
                <h3>Ordena las palabras para formar la oración correcta</h3>
                <div class="score">Puntos: <span>0</span></div>
                <div class="exercise-counter">Ejercicio: <span>1</span> / ${this.sentences.length}</div>
            </div>
            <div class="word-container"></div>
            <div class="drop-zone"></div>
            <div class="action-buttons"></div>
        `;

        this.gamesManager.gamesContainer.appendChild(container);

        const dropZone = container.querySelector('.drop-zone');
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
    }

    loadSentence() {
        const wordContainer = this.gamesManager.gamesContainer.querySelector('.word-container');
        const dropZone = this.gamesManager.gamesContainer.querySelector('.drop-zone');
        const actionButtons = this.gamesManager.gamesContainer.querySelector('.action-buttons');
        
        wordContainer.innerHTML = '';
        dropZone.innerHTML = '';
        actionButtons.innerHTML = '';

        // Actualizar el contador de ejercicio
        const exerciseCounter = this.gamesManager.gamesContainer.querySelector('.exercise-counter span');
        if (exerciseCounter) {
            exerciseCounter.textContent = (this.currentSentenceIndex + 1);
        }

        if (this.currentSentenceIndex >= this.sentences.length) {
            this.showFinalScreen();
            return;
        }

        const currentSentence = this.sentences[this.currentSentenceIndex];
        this.currentSentenceWords = currentSentence.split(' ');
        
        const scrambledWords = this.shuffle([...this.currentSentenceWords]);
        scrambledWords.forEach((word, index) => {
            const wordBox = document.createElement('div');
            wordBox.className = 'word-box draggable';
            wordBox.draggable = true;
            wordBox.textContent = word;
            wordBox.dataset.index = index;
            
            wordBox.addEventListener('dragstart', this.handleDragStart.bind(this));
            wordBox.addEventListener('dragend', this.handleDragEnd.bind(this));
            wordBox.addEventListener('click', (e) => this.handleWordClick(e, word));
            
            wordContainer.appendChild(wordBox);
        });

        // Botón para reiniciar la oración actual
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Reintentar Oración';
        retryButton.addEventListener('click', () => {
            this.loadSentence();
        });
        actionButtons.appendChild(retryButton);
    }

    handleDragStart(e) {
        this.draggedItem = e.target;
        e.target.classList.add('dragging');
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        if (this.draggedItem) {
            const dropZone = e.target.closest('.drop-zone');
            if (dropZone) {
                dropZone.appendChild(this.draggedItem);
                this.draggedItem.draggable = false;
                this.checkOrder();
            }
        }
    }

    handleWordClick(e, word) {
        const wordBox = e.target;
        this.speakWord(word);
        
        if (wordBox.parentElement.classList.contains('word-container')) {
            const dropZone = this.gamesManager.gamesContainer.querySelector('.drop-zone');
            // Calcular la posición actual y la del centro del drop zone para animar la transición
            const startRect = wordBox.getBoundingClientRect();
            const dropRect = dropZone.getBoundingClientRect();
            const targetX = dropRect.left + dropRect.width / 2 - startRect.left - startRect.width / 2;
            const targetY = dropRect.top + dropRect.height / 2 - startRect.top - startRect.height / 2;
            
            gsap.to(wordBox, {
                x: targetX,
                y: targetY,
                scale: 1.2,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    wordBox.style.transform = '';
                    dropZone.appendChild(wordBox);
                    this.checkOrder();
                }
            });
        }
    }

    speakWord(word) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    }

    checkOrder() {
        const dropZone = this.gamesManager.gamesContainer.querySelector('.drop-zone');
        const droppedWords = Array.from(dropZone.children).map(el => el.textContent);
        
        // Se evalúa solo si se han colocado todas las palabras
        if (droppedWords.length === this.currentSentenceWords.length) {
            if (JSON.stringify(droppedWords) === JSON.stringify(this.currentSentenceWords)) {
                this.score += 10;
                this.updateScore();
                this.gamesManager.showResultFeedback('¡Correcto! +10 puntos', true);
                this.showConfetti();
            } else {
                this.score -= 5;
                this.updateScore();
                this.gamesManager.showResultFeedback('¡Incorrecto! -5 puntos', false);
            }

            setTimeout(() => {
                this.currentSentenceIndex++;
                this.loadSentence();
            }, 1500);
        }
    }

    updateScore() {
        const scoreElement = this.gamesManager.gamesContainer.querySelector('.score span');
        scoreElement.textContent = this.score;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    showConfetti() {
        const numConfetti = 50;
        for (let i = 0; i < numConfetti; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            // Posicionar al centro de la pantalla
            confetti.style.left = window.innerWidth / 2 + 'px';
            confetti.style.top = window.innerHeight / 2 + 'px';
            document.body.appendChild(confetti);
            
            gsap.to(confetti, {
                x: (Math.random() - 0.5) * 300,
                y: (Math.random() - 0.5) * 300,
                rotation: Math.random() * 720,
                opacity: 0,
                scale: Math.random() * 1.5 + 0.5,
                duration: Math.random() * 1 + 2.5, // entre 2.5 y 3.5 seg.
                ease: 'power2.out',
                onComplete: () => confetti.remove()
            });
        }
    }

    showFinalScreen() {
        const container = document.createElement('div');
        container.className = 'final-screen';
        container.innerHTML = `
            <h2>¡Juego Completado!</h2>
            <div class="final-score">Puntuación final: ${this.score}</div>
            <div class="game-navigation">
                <button class="btn retry-button">Reintentar</button>
                <button class="btn game-list-button">Lista de juegos</button>
            </div>
        `;

        container.querySelector('.retry-button').addEventListener('click', () => {
            this.currentSentenceIndex = 0;
            this.score = 0;
            this.loadSentence();
        });

        container.querySelector('.game-list-button').addEventListener('click', () => {
            this.gamesManager.showGameSelection();
        });

        this.gamesManager.gamesContainer.appendChild(container);

        localStorage.setItem('game1_score', this.score);

    }

    cleanup() {
        // Limpiar cualquier recurso necesario
    }
}
