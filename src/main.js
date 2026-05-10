import { BlissRenderer } from './bliss-renderer.js?v=4';

let appData = null;
let blissRenderer = null;
let currentPage = 0;
const SYMBOLS_PER_PAGE = 40;
let allSymbolKeys = [];
let symbolKeys = [];
let currentLang = 'en';
let sentence = [];
let frequencyMap = {};
let exactMatchKey = null;

async function init() {
  const res = await fetch('./data.json?v=' + new Date().getTime());
  appData = await res.json();
  blissRenderer = new BlissRenderer(appData);

  allSymbolKeys = Object.keys(appData.store).filter(k => isNaN(parseInt(k)) && k !== '');
  
  // Calculate frequency Map based on usage as components
  for (const key of allSymbolKeys) {
    const data = appData.store[key];
    if (data && data.parts) {
      for (const part of data.parts) {
        frequencyMap[part] = (frequencyMap[part] || 0) + 1;
      }
    }
  }

  setupEventListeners();
  applyFiltersAndSort();
  renderSentence();
}

function applyFiltersAndSort() {
  const query = document.getElementById('search-box').value.toLowerCase().trim();
  const sortMethod = document.getElementById('sort-select').value;
  
  exactMatchKey = null;

  // Filter
  symbolKeys = allSymbolKeys.filter(key => {
    if (!query) return true;
    const en = (appData.translations['en'][key] || key).toLowerCase();
    const he = (appData.translations['he'][key] || '').toLowerCase();
    const raw = key.toLowerCase();
    
    const enStripped = en.startsWith('to ') ? en.substring(3) : en;
    const rawStripped = raw.startsWith('to ') ? raw.substring(3) : raw;
    
    if (en === query || he === query || raw === query || enStripped === query || rawStripped === query) {
      exactMatchKey = key;
    }
    
    // Check if any of its parts match the search query
    let hasPartMatch = false;
    const symbolData = appData.store[key];
    if (symbolData && symbolData.parts) {
      hasPartMatch = symbolData.parts.some(p => {
         const pEn = (appData.translations['en'][p] || p).toLowerCase();
         const pHe = (appData.translations['he'][p] || '').toLowerCase();
         const pRaw = p.toLowerCase();
         const pEnStripped = pEn.startsWith('to ') ? pEn.substring(3) : pEn;
         const pRawStripped = pRaw.startsWith('to ') ? pRaw.substring(3) : pRaw;
         return pEn.includes(query) || pHe.includes(query) || pRaw.includes(query) || pEnStripped.includes(query) || pRawStripped.includes(query);
      });
    }

    return en.includes(query) || he.includes(query) || raw.includes(query) || enStripped.includes(query) || rawStripped.includes(query) || hasPartMatch;
  });

  // Sort
  if (sortMethod === 'freq') {
    symbolKeys.sort((a, b) => {
      const fA = frequencyMap[a] || 0;
      const fB = frequencyMap[b] || 0;
      if (fA !== fB) return fB - fA;
      return a.localeCompare(b);
    });
  } else {
    symbolKeys.sort((a, b) => a.localeCompare(b));
  }

  currentPage = 0;
  renderGrid();
}

function setupEventListeners() {
  document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 0) {
      currentPage--;
      renderGrid();
    }
  });

  document.getElementById('next-page').addEventListener('click', () => {
    if ((currentPage + 1) * SYMBOLS_PER_PAGE < symbolKeys.length) {
      currentPage++;
      renderGrid();
    }
  });

  document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'he' : 'en';
    document.getElementById('lang-toggle').innerText = `Language: ${currentLang === 'en' ? 'English' : 'Hebrew'}`;
    document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
    applyFiltersAndSort();
    renderSentence();
  });

  document.getElementById('search-box').addEventListener('input', applyFiltersAndSort);
  
  document.getElementById('search-box').addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (symbolKeys.length > 0) {
        const query = document.getElementById('search-box').value.toLowerCase().trim();
        
        // 1. Try to find an exact match first
        let bestMatch = symbolKeys.find(k => {
          const en = (appData.translations['en'][k] || k).toLowerCase();
          const he = (appData.translations['he'][k] || '').toLowerCase();
          const raw = k.toLowerCase();
          const enStripped = en.startsWith('to ') ? en.substring(3) : en;
          return en === query || he === query || raw === query || enStripped === query;
        });
        
        // 2. Try to find a match that starts with the query
        if (!bestMatch) {
          bestMatch = symbolKeys.find(k => {
            const en = (appData.translations['en'][k] || k).toLowerCase();
            const he = (appData.translations['he'][k] || '').toLowerCase();
            const raw = k.toLowerCase();
            const enStripped = en.startsWith('to ') ? en.substring(3) : en;
            return en.startsWith(query) || he.startsWith(query) || raw.startsWith(query) || enStripped.startsWith(query);
          });
        }
        
        // 3. Fallback to the first available symbol
        if (!bestMatch) {
          bestMatch = symbolKeys[0];
        }

        document.getElementById('search-box').value = getTranslation(bestMatch);
        applyFiltersAndSort();
        
        // Jump focus to the first symbol card after a short delay to allow rendering
        setTimeout(() => {
          const firstCard = document.querySelector('.symbol-card');
          if (firstCard) firstCard.focus();
        }, 50);
      }
    }
  });

  document.getElementById('sort-select').addEventListener('change', applyFiltersAndSort);

  document.getElementById('clear-search').addEventListener('click', () => {
    document.getElementById('search-box').value = '';
    applyFiltersAndSort();
  });

  document.getElementById('clear-sentence').addEventListener('click', () => {
    sentence = [];
    renderSentence();
  });
}

function getTranslation(key) {
  const tr = appData.translations[currentLang][key];
  return tr ? tr : key;
}

function createSymbolCard(key) {
  const card = document.createElement('div');
  card.className = 'symbol-card';
  card.tabIndex = 0; // Make it focusable for keyboard navigation
  
  const exploreBtn = document.createElement('button');
  exploreBtn.className = 'explore-btn';
  exploreBtn.innerHTML = '🔍';
  exploreBtn.title = 'Explore this symbol';
  exploreBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent card click
    const searchBox = document.getElementById('search-box');
    searchBox.value = getTranslation(key);
    applyFiltersAndSort();
  });
  card.appendChild(exploreBtn);
  
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  
  const label = document.createElement('span');
  label.innerText = getTranslation(key);

  card.appendChild(label);
  card.appendChild(canvas);
  
  // Add component links and determine POS class if applicable
  const symbolData = appData.store[key];
  if (symbolData && symbolData.parts && symbolData.parts.length > 0) {
    if (symbolData.parts.includes('ACTION-INDICATOR')) {
      card.classList.add('pos-verb');
    } else if (symbolData.parts.includes('QUALITY_INDICATOR')) {
      card.classList.add('pos-adj');
    } else if (symbolData.parts.includes('THING-INDICATOR') || symbolData.parts.includes('PERSON')) {
      card.classList.add('pos-noun');
    }
    
    const partsDiv = document.createElement('div');
    partsDiv.className = 'parts-list';
    
    symbolData.parts.forEach((part, index) => {
      const link = document.createElement('a');
      link.innerText = getTranslation(part);
      link.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent card click
        const searchBox = document.getElementById('search-box');
        searchBox.value = getTranslation(part);
        applyFiltersAndSort();
      });
      partsDiv.appendChild(link);
      if (index < symbolData.parts.length - 1) {
        partsDiv.appendChild(document.createTextNode(', '));
      }
    });
    card.appendChild(partsDiv);
  }
  
  blissRenderer.drawSymbolOnCanvas(canvas, key);

  const selectSymbol = () => {
    if (sentence.length < 10) {
      sentence.push(key);
      renderSentence();
      
      // Clear search and reset grid to main screen after selection
      const searchBox = document.getElementById('search-box');
      if (searchBox.value !== '') {
        searchBox.value = '';
        applyFiltersAndSort();
      }
      
      // Return focus to the search box
      searchBox.focus();
    } else {
      alert("Sentence is too long (max 10 symbols).");
    }
  };

  card.addEventListener('click', selectSymbol);
  
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      selectSymbol();
    } else if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      
      const grid = card.parentElement;
      if (!grid) return;
      
      const cards = Array.from(grid.querySelectorAll('.symbol-card'));
      const index = cards.indexOf(card);
      if (index === -1) return;
      
      const isRTL = document.documentElement.dir === 'rtl';
      
      // Calculate columns dynamically
      const gridStyles = window.getComputedStyle(grid);
      const columns = gridStyles.getPropertyValue('grid-template-columns').trim().split(/\s+/).length;
      
      let nextIndex = index;
      
      if (e.key === 'ArrowRight') {
         nextIndex = isRTL ? index - 1 : index + 1;
      } else if (e.key === 'ArrowLeft') {
         nextIndex = isRTL ? index + 1 : index - 1;
      } else if (e.key === 'ArrowDown') {
         nextIndex = index + columns;
      } else if (e.key === 'ArrowUp') {
         nextIndex = index - columns;
      }
      
      if (nextIndex >= 0 && nextIndex < cards.length) {
         cards[nextIndex].focus();
      }
    }
  });
  
  return card;
}

function renderGrid() {
  const grid = document.getElementById('symbols-grid');
  grid.innerHTML = '';

  if (exactMatchKey) {
    document.getElementById('page-info').innerText = `Symbol Details`;
    grid.className = 'symbols-grid glass details-view';
    grid.style.display = 'flex';
    
    // 1. Target Symbol
    const targetSection = document.createElement('div');
    targetSection.className = 'details-section';
    targetSection.innerHTML = `<h2 class="details-heading">Selected Symbol</h2><div class="details-grid"></div>`;
    targetSection.querySelector('.details-grid').appendChild(createSymbolCard(exactMatchKey));
    grid.appendChild(targetSection);
    
    // 2. Composed Of
    const targetData = appData.store[exactMatchKey];
    if (targetData && targetData.parts && targetData.parts.length > 0) {
      const partsSection = document.createElement('div');
      partsSection.className = 'details-section';
      partsSection.innerHTML = `<h2 class="details-heading">Composed Of</h2><div class="details-grid"></div>`;
      const pGrid = partsSection.querySelector('.details-grid');
      targetData.parts.forEach(part => {
        pGrid.appendChild(createSymbolCard(part));
      });
      grid.appendChild(partsSection);
    }
    
    // 3. Used In
    const usedInKeys = allSymbolKeys.filter(k => {
      const data = appData.store[k];
      return data && data.parts && data.parts.includes(exactMatchKey);
    });
    
    if (usedInKeys.length > 0) {
      const usedSection = document.createElement('div');
      usedSection.className = 'details-section';
      usedSection.innerHTML = `<h2 class="details-heading">Used In</h2><div class="details-grid"></div>`;
      const uGrid = usedSection.querySelector('.details-grid');
      usedInKeys.forEach(k => {
        uGrid.appendChild(createSymbolCard(k));
      });
      grid.appendChild(usedSection);
    }
    
  } else {
    grid.className = 'symbols-grid glass';
    grid.style.display = 'grid';

    const start = currentPage * SYMBOLS_PER_PAGE;
    const end = start + SYMBOLS_PER_PAGE;
    const pageKeys = symbolKeys.slice(start, end);

    document.getElementById('page-info').innerText = `Page ${currentPage + 1} of ${Math.ceil(symbolKeys.length / SYMBOLS_PER_PAGE) || 1}`;

    pageKeys.forEach(key => {
      grid.appendChild(createSymbolCard(key));
    });
  }
}

function renderSentence() {
  const container = document.getElementById('sentence-container');
  container.innerHTML = '';

  if (sentence.length === 0) {
    container.innerHTML = '<div style="color: rgba(255,255,255,0.5); margin: auto;">Click a symbol to add it to your sentence</div>';
    return;
  }

  sentence.forEach((key, index) => {
    const item = document.createElement('div');
    item.className = 'sentence-item';
    item.title = 'Click to remove';
    
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    
    const label = document.createElement('span');
    label.innerText = getTranslation(key);

    item.appendChild(canvas);
    item.appendChild(label);
    
    item.addEventListener('click', () => {
      sentence.splice(index, 1);
      renderSentence();
    });

    blissRenderer.drawSymbolOnCanvas(canvas, key);
    container.appendChild(item);
  });
}

init();
