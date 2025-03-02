export class MemoryGame {
    constructor(gameData, gamesManager) {
      this.gameData = gameData;
      this.gamesManager = gamesManager;
      this.vocabulary = gameData.vocabulary;
      this.cards = [];
      this.flippedCards = [];
      this.matches = 0;
      this.attempts = 0;
      this.score = 0;
    }
  
    async init() {
      // Creamos y mostramos el spinner de carga en el contenedor de juegos
      const spinner = document.createElement('div');
      spinner.className = 'loading-screen';
      spinner.innerHTML = '<div class="spinner"></div>';
      this.gamesManager.gamesContainer.appendChild(spinner);
    
      // Cargamos las imágenes y creamos la UI del juego
      await this.loadImages();
      this.createUI();
      this.shuffleCards();
    
      // Una vez finalizado, removemos el spinner
      spinner.remove();
    }
  
    async loadImages() {
      this.images = {};
      for (const word of this.vocabulary) {
        try {
          const response = await axios.get(
            `https://api.pexels.com/v1/search?query=${word}&per_page=1`,
            { headers: { Authorization: PEXELS_API_KEY } }
          );
          this.images[word] =
            response.data.photos[0]?.src.medium || 'no-image.jpg';
        } catch (error) {
          console.error('Error loading image:', error);
          this.images[word] = 'no-image.jpg';
        }
      }
    }
  
    createUI() {
      // Usamos el contenedor global .game-content para respetar tus estilos
      const wrapper = document.createElement('div');
      wrapper.className = 'game-content';
      wrapper.innerHTML = `
        <div class="memory-game-container">
          <div class="score-board">
            Intentos: <span class="attempts">0</span> | Puntos: <span class="score">0</span>
            <div class="feedback-container"></div>
          </div>
          <div class="memory-grid-wrapper">
            <div class="memory-grid"></div>
          </div>
        </div>
        <style>
          /* Contenedor interno */
          .memory-game-container {
            width: 100%;
          }
          .memory-grid-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
          }
            #gamesView .game-content {
  background: none !important;
  border: none !important;
  box-shadow: none !important;
  padding: 2px !important;
  margin: 8px  !important;
}
          /* Grid responsive */
          .memory-grid {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 8px;
            padding: 5px;
            box-sizing: border-box;
          }
          /* Forzamos que las tarjetas ocupen el 100% de la celda */
          .game-content .memory-card {
            width: 100% !important;
            aspect-ratio: 1/1;
            margin: 0 !important;
            perspective: 1000px;
          }
          .memory-card > div {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 8px;
            backface-visibility: hidden;
            transition: all 0.6s;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .card-front {
            background: ${this.gamesManager.currentStory.accentColor || '#3498db'};
            transform: rotateY(0deg);
          }
          .card-back {
            background: #fff;
            transform: rotateY(180deg);
            padding: 0.3rem;
            overflow: hidden;
          }
          .card-back img {
            width: 100%;
            height: 65%; /* Imagen un poco más alta */
            object-fit: cover;
            border-radius: 8px 8px 0 0;
          }
          .card-word {
            font-size: 0.8rem;
            color: #2c3e50;
            padding: 0.2rem;
            text-align: center;
            word-break: break-word;
          }
          .memory-card.flipped .card-front {
            transform: rotateY(-180deg);
          }
          .memory-card.flipped .card-back {
            transform: rotateY(0deg);
          }
          @media (max-width: 768px) {
            .memory-grid {
              grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
              gap: 6px;
              padding: 4px;
            }
          }
          @media (max-width: 480px) {
            .memory-grid {
              grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
              gap: 2px;
              padding: 3px;
            }
          }
          /* Confetti con forma de estrella de 5 puntas */
          .confetti {
            position: fixed;
            width: 12px;
            height: 12px;
            clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
            opacity: 1;
            pointer-events: none;
          }
          /* Victory screen */
          .victory-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #fff;
            z-index: 1000;
          }
          .victory-screen .actions button {
            background: #3498db;
            border: none;
            color: #fff;
            padding: 10px 20px;
            margin: 5px;
            font-size: 1rem;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
          }
          .victory-screen .actions button:hover {
            background: #2980b9;
          }
          .score-popup {
            position: fixed;
            font-size: 1.2rem;
            font-weight: bold;
            color: #fff;
            text-shadow: 1px 1px 2px #000;
            pointer-events: none;
            z-index: 2000;
            transform: translate(-50%, -50%);
          }
        </style>
      `;
      this.gamesManager.gamesContainer.innerHTML = "";
      this.gamesManager.gamesContainer.appendChild(wrapper);
    }
  
    shuffleCards() {
      const grid = document.querySelector('.memory-grid');
      grid.innerHTML = '';
      const wordPairs = [...this.vocabulary, ...this.vocabulary];
      wordPairs.sort(() => Math.random() - 0.5);
      wordPairs.forEach((word) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
          <div class="card-front">
            <i class="icon ion-ios-help" style="font-size: 1.5rem; color: white;"></i>
          </div>
          <div class="card-back">
            <img src="${this.images[word]}" alt="${word}" loading="lazy">
            <div class="card-word">${word}</div>
          </div>
        `;
        card.addEventListener('click', () => this.flipCard(card, word));
        grid.appendChild(card);
      });
    }
  
    flipCard(card, word) {
      if (this.flippedCards.length >= 2 || card.classList.contains('flipped')) return;
      this.speakWord(word);
      card.classList.add('flipped');
      this.flippedCards.push({ card, word });
      if (this.flippedCards.length === 2) {
        this.attempts++;
        this.updateScore();
        this.checkMatch();
      }
    }
  
    speakWord(word) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  
    checkMatch() {
      const [card1, card2] = this.flippedCards;
      const isMatch = card1.word === card2.word;
  
      if (isMatch) {
        this.matches++;
        // Creamos un popup en cada tarjeta
        const popup1 = this.createScorePopup(card1.card, '+100');
        const popup2 = this.createScorePopup(card2.card, '+100');
        this.score += 100;
        // Animación: las tarjetas se desvanecen y escalan hasta desaparecer
        this.flippedCards.forEach(c => {
          gsap.to(c.card, {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            delay: 0.5,
            onComplete: () => c.card.classList.add('matched')
          });
        });
        this.displayFeedback('¡Match! +100 puntos', true);
        // Se lanza confetti desde ambas posiciones
        this.showConfetti(popup1);
        this.showConfetti(popup2);
        this.flippedCards = [];
      } else {
        this.score -= 20;
        if (this.score < 0) this.score = 0;
        this.displayFeedback('¡Incorrecto! -20 puntos', false);
        // Después de 1 segundo, se quita la clase 'flipped'
        setTimeout(() => {
          this.flippedCards.forEach(c => {
            c.card.classList.remove('flipped');
          });
          this.flippedCards = [];
        }, 1000);
      }
      this.updateScore();
      if (this.matches === this.vocabulary.length) this.showVictory();
    }
  
    createScorePopup(element, text) {
      const rect = element.getBoundingClientRect();
      const popup = document.createElement('div');
      popup.className = 'score-popup';
      popup.textContent = text;
      popup.style.left = `${rect.left + rect.width / 2}px`;
      popup.style.top = `${rect.top + rect.height / 2}px`;
      document.body.appendChild(popup);
      setTimeout(() => popup.remove(), 1000);
      return popup;
    }
  
    updateScore() {
      document.querySelector('.attempts').textContent = this.attempts;
      document.querySelector('.score').textContent = this.score;
    }
  
    displayFeedback(message, success) {
      // Usamos el toast global con animación definida en tu style.css
      const toast = document.createElement('div');
      toast.className = 'game-feedback ' + (success ? 'success' : 'error');
      toast.textContent = message;
      // Posicionamos el toast justo debajo del score-board
      const scoreboard = document.querySelector('.score-board');
      const rect = scoreboard.getBoundingClientRect();
      toast.style.top = (rect.bottom + 10) + 'px';
      toast.style.left = (rect.left + rect.width / 2) + 'px';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 2000);
    }
  
    showConfetti(originElement) {
      let originX, originY;
      if (originElement) {
        const rect = originElement.getBoundingClientRect();
        originX = rect.left + rect.width / 2;
        originY = rect.top + rect.height / 2;
      } else {
        originX = window.innerWidth / 2;
        originY = window.innerHeight / 2;
      }
      // Reducir el número de confetti para optimización
      const numConfetti = 20; // antes era 50
      // Crear un fragmento para minimizar reflows
      const fragment = document.createDocumentFragment();
      
      for (let i = 0; i < numConfetti; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.left = originX + 'px';
        confetti.style.top = originY + 'px';
        fragment.appendChild(confetti);
        
        gsap.to(confetti, {
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200,
          rotation: Math.random() * 720,
          opacity: 0,
          scale: Math.random() * 1.5 + 0.5,
          duration: Math.random() * 1 + 2.5,
          ease: 'power2.out',
          onComplete: () => confetti.remove()
        });
      }
      document.body.appendChild(fragment);
    }
    
  
    showVictory() {
      const victoryScreen = document.createElement('div');
      victoryScreen.className = 'victory-screen';
      victoryScreen.innerHTML = `
        <h2>¡Memoria Completa! 🎉</h2>
        <div class="stats">
          <p>Puntuación final: <span class="final-score">${this.score}</span></p>
          <p>Intentos totales: ${this.attempts}</p>
        </div>
        <div class="actions">
          <button class="retry-btn">Jugar de nuevo</button>
          <button class="back-btn">Volver a juegos</button>
        </div>
      `;
      gsap.from(victoryScreen, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out'
      });
      victoryScreen.querySelector('.retry-btn').addEventListener('click', () => {
        this.resetGame();
        this.shuffleCards();
      });
      victoryScreen.querySelector('.back-btn').addEventListener('click', () => {
        this.gamesManager.showGameSelection();
      });
      this.gamesManager.gamesContainer.appendChild(victoryScreen);
      // Confetti en la victoria
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        document.body.appendChild(confetti);
        gsap.to(confetti, {
          x: Math.random() * 500 - 250,
          y: window.innerHeight + 100,
          rotation: Math.random() * 360,
          duration: 3,
          ease: 'power1.out',
          onComplete: () => confetti.remove()
        });
      }

      localStorage.setItem('game3_score', this.score);

    }
  
    resetGame() {
      this.flippedCards = [];
      this.matches = 0;
      this.attempts = 0;
      this.score = 0;
      this.updateScore();
      document.querySelector('.victory-screen')?.remove();
      document.querySelectorAll('.memory-card').forEach(card => {
        card.classList.remove('matched', 'flipped');
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
        card.style.pointerEvents = 'auto';
      });
    }
  }
  