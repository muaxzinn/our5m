document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section');
  const scrollContainer = document.getElementById('scrollContainer');
  const endingSection = document.getElementById('scene-14');
  const eternalOverlay = document.getElementById('eternalOverlay');
  const lockOverlay = document.getElementById('lockOverlay');
  const lockTimer = document.getElementById('lockTimer');
  const bgMusic = document.getElementById('bgMusic');

  // Set the target date/time: July 11, 2026, 00:00:00 (Bangkok Time offset +07:00)
  const targetDate = new Date('2026-07-10T20:16:00+07:00');
  let isTransitioned = false;
  let isMusicPlaying = false;

  // --- 1. Intersection Observer for Active States ---
  const observerOptions = {
    root: scrollContainer,
    rootMargin: '0px',
    threshold: 0.6
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      } else {
        entry.target.classList.remove('active');
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    observer.observe(section);
  });

  // --- 2. Ending Section Interaction (Fade to Black & Pulsing Heart) ---
  endingSection.addEventListener('click', () => {
    if (endingSection.classList.contains('active') && !isTransitioned) {
      isTransitioned = true;
      scrollContainer.style.overflowY = 'hidden';
      eternalOverlay.classList.add('visible');
    }
  });

  // --- 3. Music Autoplay on First Scroll ---
  function startMusic() {
    if (isMusicPlaying) return;

    bgMusic.play()
      .then(() => {
        isMusicPlaying = true;
        cleanupMusicTriggers();
      })
      .catch((error) => {
        console.warn('Audio playback failed or blocked:', error);
      });
  }

  function cleanupMusicTriggers() {
    scrollContainer.removeEventListener('scroll', startMusic);
    scrollContainer.removeEventListener('wheel', startMusic);
    scrollContainer.removeEventListener('touchstart', startMusic);
    scrollContainer.removeEventListener('touchmove', startMusic);
    document.removeEventListener('click', startMusic);
    document.removeEventListener('keydown', startMusic);
  }

  function setupMusicTriggers() {
    scrollContainer.addEventListener('scroll', startMusic, { passive: true });
    scrollContainer.addEventListener('wheel', startMusic, { passive: true });
    scrollContainer.addEventListener('touchstart', startMusic, { passive: true });
    scrollContainer.addEventListener('touchmove', startMusic, { passive: true });
    document.addEventListener('click', startMusic, { passive: true });
    document.addEventListener('keydown', startMusic, { passive: true });
  }

  // --- 4. Countdown & Lock Screen Logic ---
  let countdownInterval;

  function updateCountdown() {
    const now = new Date();
    const timeLeft = targetDate - now;

    if (timeLeft <= 0) {
      // Unlocked!
      clearInterval(countdownInterval);
      unlockSite();
    } else {
      // Locked - Update timer
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      const formattedHours = String(hours).padStart(2, '0');
      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = String(seconds).padStart(2, '0');

      lockTimer.textContent = `${formattedHours} : ${formattedMinutes} : ${formattedSeconds}`;
    }
  }

  function unlockSite() {
    // Hide lock overlay with smooth fade out
    lockOverlay.classList.add('hidden');

    // Enable scrolling
    scrollContainer.classList.remove('locked');

    // Set up listeners to play music on the first scroll interaction
    setupMusicTriggers();
  }

  // Initial check
  const now = new Date();
  if (targetDate - now > 0) {
    // Lock the site
    scrollContainer.classList.add('locked');
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  } else {
    // Already unlocked
    unlockSite();
  }
});
