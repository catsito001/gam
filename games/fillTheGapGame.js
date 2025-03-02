export class FillTheGapGame {
    constructor(gameData, gamesManager) {
      this.gameData = gameData;
      this.gamesManager = gamesManager;
      this.questions = gameData.questions;
      this.currentQuestion = 0;
      this.score = 0;
      this.correctAnswer = '';
      this.currentDisplayData = null;
    }
  
    init() {
      this.createUI();
      this.loadQuestion();
    }
  
    createUI() {
      this.container = document.createElement('div');
      this.container.className = 'fill-game';
      this.container.innerHTML = `
        <style>
          .fill-game {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
          }
          
          .fill-game .reference-image {
            text-align: center;
            margin-bottom: 20px;
          }
          
          .fill-game .reference-image img {
            max-width: 60%;
            height: auto;
            border-radius: 10px;
          }
          
          /* Se ubica la oración sobre la palabra incompleta y con una tipografía más elegante */
          .fill-game .sentence-text {
            font-family: 'Georgia', serif;
            font-size: 1.8rem;
            text-align: center;
            margin-bottom: 20px;
          }
          
          .fill-game .word-display {
            font-size: 2.5rem;
            letter-spacing: 0.5rem;
            margin: 2rem 0;
            text-align: center;
            min-height: 80px;
          }
          
          .fill-game .word-display span {
            display: inline-block;
            min-width: 50px;
            height: 60px;
            line-height: 60px;
            margin: 0 5px;
            border-bottom: 3px solid #3498db;
          }
          
          .fill-game .drop-target {
            border: 2px dashed #3498db;
            background-color: #ecf0f1;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .fill-game .letters-container {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
            margin: 2rem 0;
          }
          
          .fill-game .letter-box {
            background: #fff;
            border: 3px solid #3498db;
            border-radius: 15px;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .fill-game .letter-box.used {
            opacity: 0.5;
            cursor: default;
          }
          
          .fill-game .sentence-container {
            margin: 20px 0;
            text-align: center;
          }
          
          .fill-game .answer-input {
            padding: 10px;
            font-size: 1rem;
            border: 2px solid #3498db;
            border-radius: 5px;
            outline: none;
            width: 80%;
            max-width: 400px;
            margin-bottom: 10px;
            box-sizing: border-box;
          }
          
          .fill-game .check-button {
            background: #27ae60;
            color: white;
            padding: 1rem 2rem;
            border-radius: 15px;
            border: none;
            cursor: pointer;
            display: block;
            margin: 20px auto;
          }
          
          /* Ajustes para vista móvil */
          @media (max-width: 600px) {
            .fill-game {
              padding: 10px;
              max-width: 100%;
            }
            
            .fill-game .sentence-text {
              font-size: 1.5rem;
              margin-bottom: 15px;
            }
            
            .fill-game .word-display {
              font-size: 2rem;
              letter-spacing: 0.3rem;
              margin: 1.5rem 0;
              min-height: 60px;
            }
            
            .fill-game .word-display span {
              min-width: 40px;
              height: 50px;
              line-height: 50px;
              margin: 0 3px;
            }
            
            .fill-game .letters-container {
              gap: 0.5rem;
            }
            
            .fill-game .letter-box {
              width: 50px;
              height: 50px;
              font-size: 1.5rem;
            }
            
            .fill-game .answer-input {
              width: 90%;
            }
            
            .fill-game .check-button {
              padding: 0.8rem 1.5rem;
            }
          }
          
          /* Estilos para las partículas - Estrellas de 5 puntas */
          .confetti {
            position: fixed;
            width: 12px;
            height: 12px;
            clip-path: polygon(
              50% 0%, 
              61% 35%, 
              98% 35%, 
              68% 57%, 
              79% 91%, 
              50% 70%, 
              21% 91%, 
              32% 57%, 
              2% 35%, 
              39% 35%
            );
            opacity: 1;
            pointer-events: none;
          }
        </style>
        
        <div class="game-content">
          <div class="reference-image"></div>
          <!-- La oración se muestra aquí, arriba de la palabra incompleta -->
          <div class="sentence-text"></div>
          <div class="word-display"></div>
          <div class="letters-container"></div>
          <div class="sentence-container">
            <input type="text" class="answer-input" placeholder="Escribe la palabra aquí">
            <button class="check-button">Comprobar</button>
          </div>
        </div>
      `;
    
      this.gamesManager.gamesContainer.appendChild(this.container);
    }
    
    async loadQuestion() {
      // Limpiar el input al cargar una nueva pregunta
      const input = this.container.querySelector('.answer-input');
      if (input) input.value = '';
    
      if (this.currentQuestion >= this.questions.length) {
        this.showFinalScreen();
        
        return;
      }
    
      const question = this.questions[this.currentQuestion];
      this.correctAnswer = question.answer.toLowerCase();
      this.currentDisplayData = this.generateDisplayData(question.answer);
    
      // Obtener la imagen referencial de Pexels usando la respuesta (palabra clave)
      const referenceImageUrl = await this.fetchReferenceImage(this.correctAnswer);
      const referenceImageContainer = this.container.querySelector('.reference-image');
      if (referenceImageUrl) {
        referenceImageContainer.innerHTML = `<img src="${referenceImageUrl}" alt="${this.correctAnswer}" class="reference-image-img" loading="lazy">`;
      } else {
        referenceImageContainer.innerHTML = '';
      }
      
      // Mostrar la oración sobre la palabra incompleta
      this.container.querySelector('.sentence-text').textContent =
        question.sentence.replace('______', '_'.repeat(this.correctAnswer.length));
    
      this.renderWordDisplay(question.answer, this.currentDisplayData.hiddenIndexes);
      this.renderLetterBoxes(this.generateLetters(question.answer, this.currentDisplayData.hiddenIndexes));
    
      const checkButton = this.container.querySelector('.check-button');
      checkButton.onclick = () => {
        const input = this.container.querySelector('.answer-input');
        this.checkAnswer(input.value);
      };
    }
    
    async fetchReferenceImage(query) {
      try {
        const response = await axios.get(`https://api.pexels.com/v1/search?query=${query}&per_page=1`, {
          headers: { Authorization: PEXELS_API_KEY }
        });
        if (response.data.photos && response.data.photos.length > 0) {
          return response.data.photos[0].src.medium;
        }
        return null;
      } catch (error) {
        console.error('Error fetching reference image:', error);
        return null;
      }
    }
    
    generateDisplayData(answer) {
      const answerLength = answer.length;
      const hiddenIndexes = [];
      const numToHide = Math.min(6, Math.max(2, Math.floor(answerLength / 2)));
      
      while (hiddenIndexes.length < numToHide) {
        const index = Math.floor(Math.random() * answerLength);
        if (!hiddenIndexes.includes(index)) hiddenIndexes.push(index);
      }
      return { hiddenIndexes };
    }
    
    generateLetters(answer, hiddenIndexes) {
      const requiredLetters = hiddenIndexes.map(i => answer[i].toLowerCase());
      const answerLetters = answer.toLowerCase().split('');
      const availableLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    
      // Generar letras extras
      let extraLetters = availableLetters
        .filter(letter => !answerLetters.includes(letter))
        .sort(() => Math.random() - 0.5)
        .slice(0, 8 - requiredLetters.length);
    
      // Completar con duplicados si es necesario
      while (requiredLetters.length + extraLetters.length < 8) {
        extraLetters.push(requiredLetters[Math.floor(Math.random() * requiredLetters.length)]);
      }
    
      return this.shuffle([...requiredLetters, ...extraLetters]);
    }
    
    renderWordDisplay(answer, hiddenIndexes) {
      const wordDisplay = this.container.querySelector('.word-display');
      wordDisplay.innerHTML = '';
      
      for (let i = 0; i < answer.length; i++) {
        const span = document.createElement('span');
        if (hiddenIndexes.includes(i)) {
          span.className = 'drop-target';
          span.dataset.index = i;
          span.dataset.correct = answer[i].toLowerCase();
          span.onclick = (e) => this.handleEmptyClick(e);
        } else {
          span.className = 'letter-fixed';
          span.textContent = answer[i].toUpperCase();
        }
        wordDisplay.appendChild(span);
      }
    }
    
    renderLetterBoxes(letters) {
      const lettersContainer = this.container.querySelector('.letters-container');
      lettersContainer.innerHTML = '';
      
      letters.forEach((letter, index) => {
        const box = document.createElement('div');
        box.className = 'letter-box';
        box.dataset.letter = letter.toLowerCase();
        box.textContent = letter.toUpperCase();
        box.onclick = () => this.handleLetterClick(letter, box);
        lettersContainer.appendChild(box);
      });
    }
    
    handleLetterClick(letter, box) {
      if (box.classList.contains('used')) return;
    
      let found = false;
      const dropTargets = this.container.querySelectorAll('.drop-target');
      for (let target of dropTargets) {
        if (!target.dataset.filled && target.dataset.correct === letter.toLowerCase()) {
          target.textContent = letter.toUpperCase();
          target.dataset.filled = letter.toLowerCase();
          box.classList.add('used');
          found = true;
          this.checkCompletion();
          break;
        }
      }
    
      if (!found) {
        this.gamesManager.showResultFeedback('Incorrecto', false);
        // Se restan 10 puntos por error
        this.score -= 10;
        box.classList.add('used');
      }
    }
    
    handleEmptyClick(event) {
      const target = event.target;
      if (target.dataset.filled) {
        const letter = target.dataset.filled;
        target.textContent = '';
        delete target.dataset.filled;
        
        const letterBox = [...this.container.querySelectorAll('.letter-box')]
          .find(box => box.dataset.letter === letter && box.classList.contains('used'));
        
        if (letterBox) letterBox.classList.remove('used');
      }
    }
    
    checkCompletion() {
      const dropTargets = [...this.container.querySelectorAll('.drop-target')];
      const allFilledCorrectly = dropTargets.every(target => 
        target.dataset.filled && target.dataset.filled === target.dataset.correct
      );
    
      if (allFilledCorrectly) {
        this.container.querySelector('.sentence-container').style.opacity = '1';
      }
    }
    
    checkAnswer(answer) {
      const input = this.container.querySelector('.answer-input');
      if (answer.toLowerCase() === this.correctAnswer) {
        this.score += 20;
        this.currentQuestion++;
        this.gamesManager.showResultFeedback('¡Correcto! +20 puntos', true);
        // Al acertar, se muestran las partículas
        this.showConfetti();
        input.value = '';
        setTimeout(() => this.loadQuestion(), 1000);
      } else {
        this.gamesManager.showResultFeedback('Intenta de nuevo', false);
        input.style.borderColor = '#e74c3c';
        setTimeout(() => input.style.borderColor = '#3498db', 500);
      }
    }
    
    // Método para mostrar animación de confetti (estrellas de 5 puntas, más explosivas y de movimiento más lento)
    showConfetti() {
      const numConfetti = 50;
      for (let i = 0; i < numConfetti; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        // Posicion inicial: centro de la pantalla
        confetti.style.left = window.innerWidth / 2 + 'px';
        confetti.style.top = window.innerHeight / 2 + 'px';
        document.body.appendChild(confetti);
    
        gsap.to(confetti, {
          x: (Math.random() - 0.5) * 300, // mayor dispersión
          y: (Math.random() - 0.5) * 300,
          rotation: Math.random() * 720,
          opacity: 0,
          scale: Math.random() * 1.5 + 0.5,
          duration: Math.random() * 1 + 2.5, // duración entre 2.5 y 3.5 segundos
          ease: 'power2.out',
          onComplete: () => confetti.remove()
        });
      }
    }
    
    showFinalScreen() {
      this.container.innerHTML = `
        <style>
          .final-screen {
            text-align: center;
            padding: 20px;
          }
          .final-screen h2 {
            font-size: 2rem;
            margin-bottom: 20px;
          }
          .final-screen p {
            font-size: 1.5rem;
            margin-bottom: 30px;
          }
          .final-screen button {
            background: #27ae60;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 10px;
            font-size: 1.2rem;
            cursor: pointer;
            margin: 10px;
          }
          .final-screen button:hover {
            background: #219150;
          }
        </style>
        <div class="final-screen">
          <h2>¡Juego Completado!</h2>
          <p>Puntuación final: ${this.score}</p>
          <button class="retry-button">Reintentar</button>
          <button class="game-list-button">Volver a juegos</button>
        </div>
      `;
    
      this.container.querySelector('.retry-button').onclick = () => {
        this.currentQuestion = 0;
        this.score = 0;
        this.loadQuestion();
      };
    
      this.container.querySelector('.game-list-button').onclick = () => {
        this.gamesManager.showGameSelection();
      };
      localStorage.setItem('game4_score', this.score);

    }
    
    shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    
    cleanup() {
      // Limpiar cualquier recurso necesario
      this.container.remove();
    }
  }
  