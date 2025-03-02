class StoryManager {
    constructor() {
        this.stories = [];
        this.currentStory = null;
        this.currentCardIndex = 0;
        this.cards = [];
        this.speech = null;
        this.isPlaying = false;
        this.autoPlayEnabled = true;
        this.currentHighlightTimeout = null;
        
        const userAgent = navigator.userAgent;
        this.isEdge = userAgent.includes('Edg/');
        this.isChrome = !this.isEdge && userAgent.includes('Chrome');
        
        this.init();
    }

    async init() {
        await this.loadStories();
        this.hideLoading();
        this.showStoriesList();
        this.setupEventListeners();
    }

    async loadStories() {
        try {
            const response = await axios.get(GOOGLE_SCRIPT_URL);
            const storiesData = response.data.split('||')
                .map(chunk => {
                    try {
                        const jsonStart = chunk.indexOf('{');
                        const jsonEnd = chunk.lastIndexOf('}') + 1;
                        return JSON.parse(chunk.slice(jsonStart, jsonEnd));
                    } catch(e) {
                        console.error('Error parsing chunk:', chunk);
                        return null;
                    }
                })
                .filter(data => data !== null);
            
            this.stories = storiesData.flatMap(data => data.stories);
        } catch (error) {
            console.error('Error loading stories:', error);
        }
    }

    hideLoading() {
        document.querySelector('.loading-screen').style.display = 'none';
    }

    showStoriesList() {
        const container = document.getElementById('storiesList');
        container.style.display = 'block';
        container.innerHTML = '';
    
        const headerCard = document.createElement('div');
        headerCard.className = 'stories-header-card';
        headerCard.innerHTML = '<h1>PRACTICAR INGLES CON HISTORIAS</h1>';
        container.appendChild(headerCard);
    
        const storiesCard = document.createElement('div');
        storiesCard.className = 'stories-list-card';
    
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'stories-cards-container';
        storiesCard.appendChild(cardsContainer);
        container.appendChild(storiesCard);
    
        this.stories.forEach((story, index) => {
            const card = document.createElement('div');
            card.className = 'story-card';
    
            // Extraer el título en inglés y la traducción
            const titleParts = story.title.split('<');
            const englishTitle = titleParts[0].trim(); // Título en inglés
            const translation = titleParts[1] ? titleParts[1].replace('>', '').trim() : ''; // Traducción
    
            // Crear el contenido de la tarjeta
            card.innerHTML = `
                <i class="icon ion-ios-game-controller-b"></i>
                <h3>${englishTitle}</h3>
                ${translation ? `<p class="translation-text">${translation}</p>` : ''}
            `;
    
            card.addEventListener('click', () => this.showStory(index));
            cardsContainer.appendChild(card);
        });
    }

    showStory(storyIndex) {
        this.currentStory = this.stories[storyIndex];
        this.normalizeTranslationKeys();
        document.getElementById('storiesList').style.display = 'none';
        document.getElementById('storyView').style.display = 'block';
        document.getElementById('storyTitle').textContent = this.currentStory.title.split('<')[0].trim();
        this.renderTextCards();
    }

    normalizeTranslationKeys() {
        const newTranslations = {};
        for(const [key, value] of Object.entries(this.currentStory.translation)){
            const cleanKey = key
                .replace(/[.,¿?!'"“”‘’()]/g, '')
                .toLowerCase()
                .trim();
            newTranslations[cleanKey] = value;
        }
        this.currentStory.translation = newTranslations;
    }

    async renderTextCards() {
        // Crear y mostrar el spinner de carga para el texto de la historia
        const spinner = document.createElement('div');
        spinner.className = 'loading-screen';
        spinner.innerHTML = '<div class="spinner"></div>';
        document.getElementById('storyView').appendChild(spinner);
    
        const container = document.getElementById('textCardsContainer');
        container.innerHTML = '';
        this.cards = [];
        this.currentCardIndex = 0;
    
        // Cargar cada tarjeta de texto (incluyendo imagen si la hay)
        for (const [index, textObj] of this.currentStory.text.entries()) {
            const card = document.createElement('div');
            card.className = 'text-card';
            let imageHTML = '';
            if (textObj.image) {
                try {
                    const response = await axios.get(
                        `https://api.pexels.com/v1/search?query=${textObj.image}&per_page=1`,
                        { headers: { Authorization: PEXELS_API_KEY } }
                    );
                    if (response.data.photos.length > 0) {
                        const photo = response.data.photos[0];
                        imageHTML = `
                            <div class="image-container">
                                <img src="${photo.src.medium}" 
                                    alt="${textObj.image}" 
                                    class="story-image"
                                    loading="lazy">
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Error loading image:', error);
                }
            }
            card.innerHTML = `
                ${imageHTML}
                <div class="sentence-container">
                    <div class="english-text">${this.addWordSpans(textObj.english)}</div>
                    <div class="translation-floating"></div>
                </div>
            `;
            container.appendChild(card);
            this.cards.push(card);
        }
    
        this.showCard(0);
        this.setupTextInteractions();
    
        // Remover el spinner una vez cargado el contenido
        spinner.remove();
    }
    

    addWordSpans(sentence) {
        return sentence.split(/\s+/).map(word => {
            const cleanWord = word
                .replace(/[.,¿?!'"“”‘’()]/g, '')
                .toLowerCase()
                .replace(/^'(.*)'$/, '$1');
                
            return `<span class="highlight-word" 
                    data-word="${cleanWord}"
                    data-original="${word}">${word}</span>`;
        }).join(' ');
    }

    showCard(index) {
        this.resetAudio();
        this.currentCardIndex = index;
        this.updateProgress();
        this.updateNavButtons();
        
        this.cards.forEach(card => {
            card.classList.remove('active');
            card.style.opacity = '0';
        });
        
        setTimeout(() => {
            this.cards[index].classList.add('active');
            this.cards[index].style.opacity = '1';
            if (this.autoPlayEnabled) this.handleAudio();
        }, 10);
    }

    updateProgress() {
        const progress = ((this.currentCardIndex + 1) / this.currentStory.text.length * 100).toFixed(0);
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = 
            `${this.currentCardIndex + 1}/${this.currentStory.text.length}`;
    }

    updateNavButtons() {
        const prevBtn = document.getElementById('prevCardBtn');
        const nextBtn = document.getElementById('nextCardBtn');
        
        prevBtn.disabled = this.currentCardIndex === 0;
        nextBtn.disabled = this.currentCardIndex === this.cards.length - 1;
        
        prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
        nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
    }

    setupTextInteractions() {
        document.querySelectorAll('.highlight-word').forEach(word => {
            word.addEventListener('click', (e) => {
                const cleanWord = e.target.dataset.word;
                const translated = this.currentStory.translation[cleanWord];
                
                if(translated) {
                    this.showWordTranslation(e.target, translated);
                    e.target.classList.remove('no-translation');
                } else {
                    e.target.classList.add('no-translation');
                    setTimeout(() => e.target.classList.remove('no-translation'), 2000);
                }
                
                const utterance = new SpeechSynthesisUtterance(e.target.dataset.original);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            });
        });
    }

    showWordTranslation(element, translation) {
        const tooltip = document.createElement('div');
        tooltip.className = 'word-tooltip';
        tooltip.textContent = translation;
        
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${rect.left + (rect.width / 2)}px`;
        tooltip.style.top = `${rect.top + scrollTop - 10}px`;
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.remove();
        }, 2000);
    }

    handleAudio() {
        if (this.isPlaying) {
            window.speechSynthesis.cancel();
            this.isPlaying = false;
            document.getElementById('mainAudioButton').innerHTML = '<i class="icon ion-ios-play"></i>';
            return;
        }
        
        const text = this.currentStory.text[this.currentCardIndex].english;
        const button = document.getElementById('mainAudioButton');
        const words = this.cards[this.currentCardIndex].querySelectorAll('.highlight-word');
        
        this.speech = new SpeechSynthesisUtterance(text);
        this.speech.lang = 'en-US';
        
        if (this.isEdge) {
            const wordsArray = text.split(' ');
            const boundaries = [];
            let offset = 0;
            for (let i = 0; i < wordsArray.length; i++) {
                boundaries.push({ start: offset, end: offset + wordsArray[i].length });
                offset += wordsArray[i].length + 1;
            }
            
            this.speech.onboundary = (event) => {
                if (event.name === 'word') {
                    const foundIndex = boundaries.findIndex(b => event.charIndex >= b.start && event.charIndex < b.end);
                    if (foundIndex !== -1) {
                        words.forEach(w => w.classList.remove('active'));
                        words[foundIndex].classList.add('active');
                    }
                }
            };
            
            this.speech.onstart = () => {
                this.isPlaying = true;
                button.innerHTML = '<i class="icon ion-ios-pause"></i>';
            };
            
        } else if (this.isChrome) {
            let currentWord = 0;
            let startTime = 0;
            
            this.speech.onstart = () => {
                this.isPlaying = true;
                button.innerHTML = '<i class="icon ion-ios-pause"></i>';
                startTime = Date.now();
                
                const wordDurations = this.calculateExactWordDurations(text, window.speechSynthesis.getVoices()[0]?.voiceURI || '', 1.0);
                
                const highlightNextWord = () => {
                    if (currentWord < words.length) {
                        words.forEach(w => w.classList.remove('active'));
                        words[currentWord].classList.add('active');
                        
                        const nextWordDelay = wordDurations[currentWord];
                        this.currentHighlightTimeout = setTimeout(highlightNextWord, nextWordDelay);
                        currentWord++;
                    }
                };
                
                highlightNextWord();
            };
        } else {
            this.speech.onstart = () => {
                this.isPlaying = true;
                button.innerHTML = '<i class="icon ion-ios-pause"></i>';
                this.genericHighlight(text, words);
            };
        }
        
        this.speech.onend = () => {
            this.isPlaying = false;
            button.innerHTML = '<i class="icon ion-ios-play"></i>';
            words.forEach(w => w.classList.remove('active'));
            this.showSpanishTranslation(this.currentCardIndex);
        };
    
        window.speechSynthesis.speak(this.speech);
    }

    calculateExactWordDurations(text, voiceURI, rate) {
        const synth = window.speechSynthesis;
        const testUtterance = new SpeechSynthesisUtterance(text);
        testUtterance.voice = synth.getVoices().find(v => v.voiceURI === voiceURI);
        testUtterance.rate = rate;
        
        const avgCharsPerSecond = 15;
        const words = text.split(' ');
        
        return words.map(word => {
            const wordLength = word.replace(/[^a-zA-Z]/g, '').length;
            const duration = (wordLength / avgCharsPerSecond) * 1000;
            return duration * (1 / rate);
        });
    }

    genericHighlight(text, words) {
        const wordTimes = this.calculateWordTimes(text);
        let currentWord = 0;
        
        const highlightWord = () => {
            words.forEach(w => w.classList.remove('active'));
            if (currentWord < words.length) {
                words[currentWord].classList.add('active');
                if (this.isEdge) void words[currentWord].offsetWidth;
                
                this.currentHighlightTimeout = setTimeout(() => {
                    currentWord++;
                    highlightWord();
                }, wordTimes[currentWord]);
            }
        };
        highlightWord();
    }

    calculateWordTimes(text) {
        const wordCount = text.split(' ').length;
        const avgSpeed = 0.30;
        return Array(wordCount).fill(avgSpeed * 1000);
    }

    showSpanishTranslation(index) {
        const translation = this.currentStory.text[index].spanish;
        const translationElement = this.cards[index].querySelector('.translation-floating');
        translationElement.textContent = translation;
        
        requestAnimationFrame(() => {
            translationElement.classList.add('show');
        });
        
        setTimeout(() => {
            translationElement.classList.remove('show');
        }, 3000);
    }

    resetAudio() {
        if (this.speech) {
            this.speech.onend = null;
            this.speech.onstart = null;
            
            if (this.isEdge) {
                window.speechSynthesis.pause();
                window.speechSynthesis.cancel();
                window.speechSynthesis.resume();
            } else {
                window.speechSynthesis.cancel();
            }
            
            this.speech = null;
        }
        if (this.currentHighlightTimeout) {
            clearTimeout(this.currentHighlightTimeout);
            this.currentHighlightTimeout = null;
        }
        this.isPlaying = false;
        document.getElementById('mainAudioButton').innerHTML = '<i class="icon ion-ios-play"></i>';
    }

    backToStories() {
        document.getElementById('storyView').style.display = 'none';
        document.getElementById('storiesList').style.display = 'grid';
        window.scrollTo(0, 0);
        this.resetAudio();
    }

    setupEventListeners() {
        document.getElementById('mainAudioButton').addEventListener('click', () => this.handleAudio());
        
        document.getElementById('prevCardBtn').addEventListener('click', () => {
            if (this.currentCardIndex > 0) {
                this.showCard(this.currentCardIndex - 1);
            }
        });

        document.getElementById('nextCardBtn').addEventListener('click', () => {
            if (this.currentCardIndex < this.cards.length - 1) {
                this.showCard(this.currentCardIndex + 1);
            }
        });

        document.getElementById('backToStoriesButton').addEventListener('click', () => this.backToStories());

        let touchStartX = 0;
        document.getElementById('textCardsContainer').addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, false);

        document.getElementById('textCardsContainer').addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.showCard(this.currentCardIndex + 1);
                else this.showCard(this.currentCardIndex - 1);
            }
        }, false);

        document.getElementById('startGames').addEventListener('click', () => {
            const event = new CustomEvent('startGames', {
                detail: { story: this.currentStory }
            });
            document.dispatchEvent(event);
        });

        document.getElementById('backToStory').addEventListener('click', () => {
            document.getElementById('gamesView').style.display = 'none';
            document.getElementById('storyView').style.display = 'block';
        });

        document.getElementById('shareWhatsApp').addEventListener('click', () => this.shareStory());
    }

    shareStory() {
        const baseUrl = "https://egamply.web.app";
        const storyTitle = this.currentStory.title.split('<')[0].trim();
        const shareUrl = `${baseUrl}/?ref=share&v=${Date.now()}`;
    
        const message = encodeURIComponent(
            `¡Aprende inglés con esta historia: *${storyTitle}*! 🚀\n\n` +
            `Juega gratis: ${shareUrl}`
        );
    
        // Detectar si el dispositivo es móvil
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        if (isMobile) {
            window.open(`whatsapp://send?text=${message}`);
        } else {
            window.open(`https://web.whatsapp.com/send?text=${message}`, '_blank');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new StoryManager();
});