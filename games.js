import { SentenceOrderGame } from './games/sentenceOrderGame.js';
import { QuizGame } from './games/quizGame.js';
import { MemoryGame } from './games/memoryGame.js';
import { FillTheGapGame } from './games/fillTheGapGame.js';

class GamesManager {
    constructor() {
        this.currentGame = null;
        this.currentGameIndex = 0;
        this.currentStory = null;
        this.gamesContainer = document.getElementById('gameContent');
        this.memoryCards = [];
        this.setupGameNavigation();
    }

    setupGameNavigation() {
        this.backToStoryBtn = document.getElementById('backToStory');
        this.backToListBtn = document.createElement('button');
        
        this.backToListBtn.className = 'back-button';
        this.backToListBtn.innerHTML = '<i class="icon ion-ios-arrow-back"></i>';
        this.backToListBtn.style.display = 'none';
        
        const gamesHeader = document.querySelector('.games-header');
        gamesHeader.insertBefore(this.backToListBtn, document.getElementById('gameTitle'));
        
        this.backToStoryBtn.addEventListener('click', () => this.returnToStory());
        this.backToListBtn.addEventListener('click', () => this.showGameSelection());
    }

    returnToStory() {
        document.getElementById('gamesView').style.display = 'none';
        document.getElementById('storyView').style.display = 'block';
        this.cleanupGameState();
    }

    cleanupGameState() {
        if (this.currentGame) {
            if (this.currentGame.timer) clearInterval(this.currentGame.timer);
            if (this.currentGame.cleanup) this.currentGame.cleanup();
        }
        this.currentGame = null;
        this.currentGameIndex = 0;
    }

    showGame(story) {
        this.currentStory = story;
        document.getElementById('storyView').style.display = 'none';
        document.getElementById('gamesView').style.display = 'block';
        this.showGameSelection();
    }

    showGameSelection() {
        this.cleanupGameState();
        this.backToListBtn.style.display = 'none';
        this.backToStoryBtn.style.display = 'inline-flex';
        
        this.gamesContainer.innerHTML = `
            <div class="games-selection">
                ${this.currentStory.games.map((game, index) => {
                    const gameType = Object.keys(game)[0];
                    const savedScore = localStorage.getItem(`${gameType}_score`);
                    const maxScore = this.calculateMaxScore(game[gameType]);
                    
                    return `
                        <div class="game-card" data-index="${index}">
    <h3>${game[gameType].title}</h3>
    <p>${this.getGameDescription(gameType)}</p>
    
    ${index < 4 ? `
        ${savedScore ? `
            <div class="score-badge"> <!-- Eliminar el contenedor extra -->
                ${savedScore}/${maxScore}
            </div>
        ` : '<div class="game-badge">Disponible</div>'}
    ` : ''}
</div>
                    `}).join('')}
            </div>
        `;
    
        // Agregas los eventos para cada tarjeta, etc.
        document.querySelectorAll('.game-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                if (index < 4) {
                    this.currentGameIndex = index;
                    this.loadGame(this.currentStory.games[index]);
                }
            });
        });
    }



    calculateMaxScore(gameData) {
        if(gameData.questions) return gameData.questions.length * 20;
        if(gameData.vocabulary) return gameData.vocabulary.length * 100;
        if(gameData.sentences) return gameData.sentences.length * 10;
        return 100; // Valor por defecto
    }
    
    

    getGameDescription(gameType) {
        const descriptions = {
            game1: 'Ordena palabras para formar oraciones',
            game2: 'Preguntas de opción múltiple',
            game3: 'Juego de memoria con vocabulario',
            game4: 'Completa los espacios faltantes'
        };
        return descriptions[gameType];
    }

    
    loadGame(gameData) {
        this.gamesContainer.style.height = 'calc(100vh - 60px)';
        this.gamesContainer.style.overflow = 'auto';
        

        this.backToListBtn.style.display = 'inline-flex';
        this.backToStoryBtn.style.display = 'none';
        this.gamesContainer.innerHTML = '';
        
        const gameType = Object.keys(gameData)[0];
        const game = gameData[gameType];
        document.getElementById('gameTitle').textContent = game.title;

        switch(gameType) {
            case 'game1':
                this.currentGame = new SentenceOrderGame(game, this);
                break;
            case 'game2':
                this.currentGame = new QuizGame(game, this);
                break;
            case 'game3':
                this.currentGame = new MemoryGame(game, this);
                break;
            case 'game4':
                this.currentGame = new FillTheGapGame(game, this);
                break;
        }
        
        if (this.currentGame && this.currentGame.init) {
            this.currentGame.init();
        }
    }





    loadNextGame() {
        const nextIndex = this.currentGameIndex + 1;
        if (nextIndex < this.currentStory.games.length) {
            this.currentGameIndex = nextIndex;
            this.loadGame(this.currentStory.games[nextIndex]);
        } else {
            this.showResultFeedback('¡Todos los juegos completados!', true);
            setTimeout(() => this.showGameSelection(), 2000);
        }
    }

    showResultFeedback(message, isSuccess) {
        const feedback = document.createElement('div');
        feedback.className = `game-feedback ${isSuccess ? 'success' : 'error'}`;
        feedback.textContent = message;
        
        this.gamesContainer.appendChild(feedback);
        setTimeout(() => feedback.remove(), 1500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const gamesManager = new GamesManager();
    
    document.addEventListener('startGames', (e) => {
        gamesManager.showGame(e.detail.story);
    });
});