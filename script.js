document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('section');
  const scrollContainer = document.getElementById('scrollContainer');
  const endingSection = document.getElementById('scene-14');
  const eternalOverlay = document.getElementById('eternalOverlay');
  const lockOverlay = document.getElementById('lockOverlay');
  const lockTimer = document.getElementById('lockTimer');
  const bgMusic = document.getElementById('bgMusic');

  // Set the target date/time: July 11, 2026, 00:00:00 local time
  // (Month index 6 is July. This constructor works on all browsers including iOS Safari)
  const targetDate = new Date(2026, 6, 11, 0, 0, 0);
  let isTransitioned = false;
  let isMusicPlaying = false;
  let clockOffset = 0; // Offset between server time and local system time
  let isTimeSynced = false;

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

  // --- 4. Sync Time with Server (Hybrid Clock) ---
  async function syncTimeWithServer() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

    const startTime = performance.now();
    try {
      // Fetch headers only of the current page to get the server clock Date header
      const response = await fetch(window.location.href, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const serverDateStr = response.headers.get('Date');
      if (serverDateStr) {
        const latency = (performance.now() - startTime) / 2;
        const serverTime = new Date(serverDateStr).getTime() + latency;
        clockOffset = serverTime - Date.now();
        isTimeSynced = true;
        console.log(`[Time Sync] Success. Clock Offset: ${clockOffset}ms (Latency: ${latency.toFixed(1)}ms)`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('[Time Sync] Failed or timed out. Falling back to local device clock:', error);
    }
  }

  // --- 5. Countdown & Lock Screen Logic ---
  let countdownInterval;

  function updateCountdown() {
    // Calculate current time factoring in the server clock offset
    const now = new Date(Date.now() + clockOffset);
    const timeLeft = targetDate - now;

    if (isNaN(timeLeft) || timeLeft <= 0) {
      // Unlocked! (Or safety fallback if date parsing failed)
      clearInterval(countdownInterval);
      unlockSite();
    } else {
      // Locked - Update timer (using Option 1: Native Date object methods, Math.ceil to prevent 1-second lag)
      const diffDate = new Date(Math.ceil(timeLeft / 1000) * 1000);
      const hours = diffDate.getUTCHours();
      const minutes = diffDate.getUTCMinutes();
      const seconds = diffDate.getUTCSeconds();

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

  // Start server clock synchronization asynchronously
  syncTimeWithServer();

  // Initial check based on current local clock (will update when sync completes)
  const now = new Date();
  const initialTimeLeft = targetDate - now;
  if (!isNaN(initialTimeLeft) && initialTimeLeft > 0) {
    // Lock the site
    scrollContainer.classList.add('locked');
    updateCountdown();
    // Update every 200ms for high synchronization with the clock
    countdownInterval = setInterval(updateCountdown, 200);
  } else {
    // Already unlocked (or invalid date fallback)
    unlockSite();
  }
});
