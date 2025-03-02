export class QuizGame {
    constructor(gameData, gamesManager) {
        this.gameData = gameData;
        this.gamesManager = gamesManager;
        this.questions = gameData.questions;
        this.currentQuestion = 0;
        this.score = 0;
        this.timer = null;
        this.timePerQuestion = 15;
    }

    init() {
        this.createUI();
        this.loadQuestion();
    }

    createUI() {
        const container = document.createElement('div');
        container.className = 'game-container quiz-game';
        container.innerHTML = `
            <div class="quiz-container">
                <div class="quiz-score">Puntos: <span class="score-number">0</span></div>
                <div class="question-card">
                    <div class="question-header">
                        <div class="question-progress">Pregunta <span class="current-q">1</span>/<span class="total-q">${this.questions.length}</span></div>
                        <div class="timer-bar">
                            <div class="timer-progress"></div>
                        </div>
                    </div>
                    <div class="question-content"></div>
                </div>
            </div>
        `;

        this.gamesManager.gamesContainer.appendChild(container);
    }

    loadQuestion() {
        const question = this.questions[this.currentQuestion];
        const content = this.gamesManager.gamesContainer.querySelector('.question-content');
        content.innerHTML = `
            ${question.image ? `<img src="${question.image}" class="question-image">` : ''}
            <h3 class="question-text">${question.question}</h3>
            <div class="options-grid"></div>
        `;
    
        // Lee la pregunta en inglés
        this.readQuestion(question.question);
    
        const optionsContainer = content.querySelector('.options-grid');
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'quiz-option';
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => this.checkAnswer(option, question.correct_answer));
            optionsContainer.appendChild(optionElement);
        });
    
        this.updateProgress();
        this.startTimer();
    }

    readQuestion(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
    
    startTimer() {
        const timerProgress = this.gamesManager.gamesContainer.querySelector('.timer-progress');
        timerProgress.style.width = '100%';
        
        let timeLeft = this.timePerQuestion;
        this.timer = setInterval(() => {
            timeLeft--;
            timerProgress.style.width = `${(timeLeft / this.timePerQuestion) * 100}%`;
            
            if(timeLeft <= 0) {
                clearInterval(this.timer);
                this.handleTimeOut();
            }
        }, 1000);
    }

    checkAnswer(selected, correct) {
        clearInterval(this.timer);
        const options = Array.from(this.gamesManager.gamesContainer.querySelectorAll('.quiz-option'));
        
        options.forEach(opt => {
            opt.classList.add('disabled');
            if(opt.textContent === correct) opt.classList.add('correct');
            if(opt.textContent === selected && selected !== correct) opt.classList.add('incorrect');
        });

        if(selected === correct) {
            this.score += 20;
            this.updateScore();
            this.gamesManager.showResultFeedback('¡Correcto! +20 puntos', true);
            gsap.to('.quiz-option.correct', {
                scale: 1.1,
                duration: 0.3,
                yoyo: true,
                repeat: 1
            });
            // Reproduce en voz alta la respuesta elegida
            this.speakAnswer(selected);
            this.showConfetti();
        } else {
            this.gamesManager.showResultFeedback('Incorrecto', false);
            gsap.to('.quiz-option.incorrect', {
                x: 10,
                duration: 0.1,
                yoyo: true,
                repeat: 5
            });
        }

        setTimeout(() => {
            this.currentQuestion++;
            if(this.currentQuestion < this.questions.length) {
                this.loadQuestion();
            } else {
                this.showResults();
            }
        }, 2000);
    }

    speakAnswer(answer) {
        const utterance = new SpeechSynthesisUtterance(answer);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }

    updateProgress() {
        this.gamesManager.gamesContainer.querySelector('.current-q').textContent = this.currentQuestion + 1;
        this.gamesManager.gamesContainer.querySelector('.total-q').textContent = this.questions.length;
    }

    updateScore() {
        this.gamesManager.gamesContainer.querySelector('.score-number').textContent = this.score;
    }

    handleTimeOut() {
        this.gamesManager.showResultFeedback('¡Tiempo agotado!', false);
        this.currentQuestion++;
        if(this.currentQuestion < this.questions.length) {
            this.loadQuestion();
        } else {
            this.showResults();
        }
    }

    showResults() {
        // Limpia el contenido previo del contenedor del juego
        this.gamesManager.gamesContainer.innerHTML = '';
        
        const container = document.createElement('div');
        container.className = 'quiz-results';
        container.innerHTML = `
            <h2>¡Quiz Completado!</h2>
            <div class="final-score">Puntuación: ${this.score}/${this.questions.length * 20}</div>
            <div class="game-navigation">
                <button class="btn retry-button">Reintentar</button>
                <button class="btn game-list-button">Lista de juegos</button>
            </div>
        `;
    
        container.querySelector('.retry-button').addEventListener('click', () => {
            this.currentQuestion = 0;
            this.score = 0;
            this.gamesManager.gamesContainer.innerHTML = '';
            // Vuelve a crear la interfaz base del juego
            this.createUI();
            this.loadQuestion();
        });
    
        container.querySelector('.game-list-button').addEventListener('click', () => {
            this.gamesManager.showGameSelection();
        });
    
        this.gamesManager.gamesContainer.appendChild(container);

        localStorage.setItem('game2_score', this.score);

    }

    // Animación de confetti para cuando la respuesta es correcta
    showConfetti() {
        const numConfetti = 50; // Número de partículas
        for (let i = 0; i < numConfetti; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            // Configuración inicial del confetti
            confetti.style.position = 'fixed';
            confetti.style.top = '50%';
            confetti.style.left = '50%';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.opacity = '1';
            document.body.appendChild(confetti);
            
            gsap.to(confetti, {
                x: (Math.random() - 0.5) * window.innerWidth,
                y: (Math.random() - 1) * window.innerHeight,
                rotation: Math.random() * 720,
                opacity: 0,
                scale: Math.random() * 1.5 + 0.5,
                duration: Math.random() * 1 + 1,
                ease: 'power2.out',
                onComplete: () => confetti.remove()
            });
        }
    }

    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}
