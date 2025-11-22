// Presentation logic for Input Devices and Their Uses
let slides = [];
let currentSlide = 0;
let isDarkTheme = true;
let speakEnabled = false;

// Color palette (base colors for slides) used to compute readable text color
const baseColors = [
  '#1a1a2e','#0f3460','#16213e','#e94560','#16213e','#0f3460','#e94560','#f2e9e4','#0f3460','#e94560','#1a1a2e','#f2e9e4','#0f3460','#e94560','#16213e','#0f3460','#f2e9e4'
];

// Load slides from JSON
fetch('slides.json')
  .then(res => res.json())
  .then(data => {
    slides = data;
    renderSlides();
    renderThumbnails();
    showSlide(0);
    updateProgressBar();
    updateSlideCounter();
  });

function renderSlides() {
  const pres = document.getElementById('presentation');
  pres.innerHTML = '';
  slides.forEach((slide, idx) => {
    const slideDiv = document.createElement('div');
    slideDiv.className = 'slide';
    slideDiv.id = `slide-${idx}`;
    // Unique background per slide
    slideDiv.style.background = getSlideBackground(idx);
    // Apply text theme based on base color luminance for contrast-safe text/backdrop
    const base = baseColors[idx % baseColors.length];
    if (isColorLight(base)) slideDiv.classList.add('light-text'); else slideDiv.classList.add('dark-text');
    // Content with animations
    slideDiv.innerHTML = `
      <div class="slide-content">
          <div class="slide-title stagger">${slide.title || ''}</div>
          ${slide.subtitle ? `<div class='slide-subtitle stagger'>${slide.subtitle}</div>` : ''}
          <div class="slide-text stagger">${slide.content || ''}</div>
          ${slide.video ? `<video class='slide-media stagger' src="images/${slide.video}" controls loop playsinline></video>` : ''}
          ${slide.gif ? `<img class='slide-media stagger' src="images/${slide.gif}" alt="GIF for ${slide.title}">` : ''}
          ${slide.media ? renderMedia(slide.media) : ''}
          ${slide.points ? renderPoints(slide.points) : ''}
        </div>
        <div class="slide-image">
          ${slide.image ? `<img class="stagger floaty" src="images/${slide.image}" alt="${slide.title}" onerror="this.src='images/placeholder.jpg'">` : ''}
        </div>
    `;
    pres.appendChild(slideDiv);
  });
}

function renderThumbnails() {
  const container = document.getElementById('thumbnails');
  container.innerHTML = '';
  slides.forEach((slide, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'thumbnail';
    thumb.innerHTML = `<div class="thumb-num">${idx + 1}</div><div class="thumb-title">${slide.title.substring(0, 15)}</div>`;
    thumb.onclick = () => showSlide(idx);
    container.appendChild(thumb);
  });
}

function renderMedia(media) {
  if (Array.isArray(media)) {
    return media.map((m, i) => renderMedia(m)).join('');
  }
  if (typeof media === 'string') {
    if (media.endsWith('.mp4') || media.endsWith('.webm')) {
      return `<video class='slide-media' src="images/${media}" controls loop playsinline></video>`;
    }
    if (media.endsWith('.gif')) {
      return `<img class='slide-media' src="images/${media}" alt="GIF">`;
    }
    if (media.endsWith('.jpg') || media.endsWith('.png') || media.endsWith('.jpeg') || media.endsWith('.svg')) {
      return `<img class='slide-media' src="images/${media}" alt="Media">`;
    }
  }
  return '';
}

function renderPoints(points) {
  if (!points || !points.length) return '';
  const items = points.map(p => `
      <li class="stagger">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      <div class="text-backdrop">${p}</div>
    </li>`).join('');
  return `<ul class="point-list" style="animation-delay:0.35s">${items}</ul>`;
}

function getSlideBackground(idx) {
  // Build a simple gradient using the base color and a contrasting accent
  const base = baseColors[idx % baseColors.length];
  const accent = '#e94560';
  return `linear-gradient(120deg, ${base} 55%, ${accent} 100%)`;
}

// Helpers to compute perceived luminance from hex color; used to choose dark/light text
function hexToRgb(hex) {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  return [ (bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255 ];
}
function luminance(r,g,b){
  const a = [r,g,b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  });
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
}
function isColorLight(hex){
  try {
    const [r,g,b] = hexToRgb(hex);
    return luminance(r,g,b) > 0.5;
  } catch(e){ return false; }
}

function showSlide(idx) {
  const slidesDivs = document.querySelectorAll('.slide');
  slidesDivs.forEach((slide, i) => {
    slide.classList.remove('active');
    slide.style.zIndex = 1;
  });
  if (slidesDivs[idx]) {
    slidesDivs[idx].classList.add('active');
    slidesDivs[idx].style.zIndex = 2;
  }
  currentSlide = idx;
  updateNavButtons();
  updateProgressBar();
  updateSlideCounter();
  updateSpeakerNotes();
  updateThumbnails();
  // Preload next image for faster transitions
  const nextIdx = idx + 1;
  if (slides[nextIdx] && slides[nextIdx].image) {
    const pre = new Image();
    pre.src = `images/${slides[nextIdx].image}`;
  }
  // Ensure current slide image loads eagerly for immediate display
  const currentImg = document.querySelector(`#slide-${idx} .slide-image img`);
  if (currentImg) {
    currentImg.loading = 'eager';
    currentImg.decoding = 'async';
  }
  // Orchestrate staggered enter animations
  const activeSlideDiv = document.querySelector(`#slide-${idx}`);
  if (activeSlideDiv) animateSlideSequence(activeSlideDiv);
  // Speak title if enabled
  if (speakEnabled && slides[idx] && slides[idx].title) {
    speak(slides[idx].title);
  }
}

// Simple text-to-speech helper using Web Speech API
function speak(text){
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.rate = 1.0;
    ut.pitch = 1.0;
    ut.lang = 'en-US';
    window.speechSynthesis.speak(ut);
  } catch(e){ console.warn('TTS failed', e); }
}

// Orchestrate staggered reveals and subtle continuous effects for a slide
function animateSlideSequence(slideDiv) {
  // Remove any lingering .show classes in other slides
  document.querySelectorAll('.stagger.show').forEach(el => el.classList.remove('show'));

  const elements = Array.from(slideDiv.querySelectorAll('.stagger'));
  // Slight base delay to let slide 'active' class settle
  const baseDelay = 120;
  elements.forEach((el, i) => {
    // reset in case
    el.classList.remove('show');
    setTimeout(() => {
      el.classList.add('show');
      // add tiny pulse to call-to-action elements (like media)
      if (el.classList.contains('slide-media')) {
        el.classList.add('pulse');
        setTimeout(() => el.classList.remove('pulse'), 2400);
      }
    }, baseDelay + i * 110);
  });
}

function updateProgressBar() {
  const progress = ((currentSlide + 1) / slides.length) * 100;
  document.getElementById('progress-bar').style.width = progress + '%';
}

function updateSlideCounter() {
  const total = slides.length;
  document.getElementById('slide-counter').textContent = `${currentSlide + 1} / ${total}`;
}

function updateSpeakerNotes() {
  const notes = slides[currentSlide].notes || 'No speaker notes for this slide.';
  document.getElementById('notes-content').textContent = notes;
}

function updateThumbnails() {
  const thumbs = document.querySelectorAll('.thumbnail');
  thumbs.forEach((thumb, i) => {
    thumb.classList.toggle('active', i === currentSlide);
  });
}

function transitionTo(targetIdx) {
  const currentDiv = document.querySelector(`#slide-${currentSlide}`);
  if (currentDiv) {
    currentDiv.classList.add('exiting');
  }
  const delay = 260; // matches CSS transition timing
  setTimeout(() => {
    if (currentDiv) {
      currentDiv.classList.remove('exiting');
    }
    showSlide(targetIdx);
    const incoming = document.querySelector(`#slide-${targetIdx}`);
    if (incoming) {
      incoming.classList.add('incoming');
      setTimeout(() => incoming.classList.remove('incoming'), 680);
    }
  }, delay);
}

function nextSlide() {
  if (currentSlide < slides.length - 1) transitionTo(currentSlide + 1);
}

function prevSlide() {
  if (currentSlide > 0) transitionTo(currentSlide - 1);
}

function updateNavButtons() {
  document.getElementById('prevBtn').disabled = currentSlide === 0;
  document.getElementById('nextBtn').disabled = currentSlide === slides.length - 1;
}

// Setup navigation and fullscreen after DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nextBtn').onclick = nextSlide;
  document.getElementById('prevBtn').onclick = prevSlide;
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.onclick = () => {
      const elem = document.documentElement;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
        else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      }
    };
  }
  
  // Theme toggle
  document.getElementById('themeToggle').onclick = () => {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('light-theme', !isDarkTheme);
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
  };

  // Speak toggle
  const speakBtn = document.getElementById('speakToggle');
  if (speakBtn) {
    // load saved preference
    speakEnabled = localStorage.getItem('speak') === 'true';
    speakBtn.setAttribute('aria-pressed', speakEnabled ? 'true' : 'false');
    speakBtn.onclick = () => {
      speakEnabled = !speakEnabled;
      speakBtn.setAttribute('aria-pressed', speakEnabled ? 'true' : 'false');
      localStorage.setItem('speak', speakEnabled ? 'true' : 'false');
      if (speakEnabled && slides[currentSlide] && slides[currentSlide].title) speak(slides[currentSlide].title);
    };
  }
  
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  isDarkTheme = savedTheme === 'dark';
  document.body.classList.toggle('light-theme', !isDarkTheme);
  
  // Speaker Notes Toggle
  document.getElementById('toggleNotes').onclick = () => {
    const panel = document.getElementById('notes-panel');
    panel.classList.toggle('hidden');
  };
  
  // Thumbnail Toggle (press T)
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' || e.key === 'T') {
      document.getElementById('thumbnail-panel').classList.toggle('hidden');
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
    if ((e.key === 'f' || e.key === 'F') && fullscreenBtn) fullscreenBtn.click();
  });

  // Intro overlay: show on first visit unless user opted out
  const intro = document.getElementById('intro-overlay');
  const getStarted = document.getElementById('getStartedBtn');
  const dontShow = document.getElementById('dontShowAgain');
  function hideIntro(save) {
    if (!intro) return;
    intro.setAttribute('aria-hidden','true');
    document.body.classList.remove('intro-active');
    if (save && dontShow && dontShow.checked) localStorage.setItem('seenIntro','true');
  }
  function showIntro() {
    if (!intro) return;
    intro.setAttribute('aria-hidden','false');
    document.body.classList.add('intro-active');
    // optional: speak a warm greeting
    if (speakEnabled) speak('Welcome. Opening presentation.');
  }
  // wire buttons
  if (getStarted) getStarted.onclick = () => hideIntro(true);
  // keyboard support: Enter to dismiss
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && intro && intro.getAttribute('aria-hidden') === 'false') {
      e.preventDefault(); hideIntro(true);
    }
  });
  // decide whether to show intro
  const seen = localStorage.getItem('seenIntro') === 'true';
  if (!seen) {
    // small delay to let DOM settle
    setTimeout(showIntro, 180);
  } else if (intro) {
    intro.setAttribute('aria-hidden','true');
  }
});