/* ============================================================
   WEDDING INVITATION — script.js
   Handles:
     1. Intro video overlay — autoplay, then fade out
     2. Animated envelope — flap opens, letter rises
     3. Scroll-reveal animations via IntersectionObserver
   ============================================================ */

'use strict';

/* ============================================================
   UTILITY: Wait for DOM to be ready
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. INTRO VIDEO OVERLAY
     The video plays full-screen. When it ends (or the user
     clicks "Skip intro"), the overlay fades out and the main
     content becomes interactive.
  ============================================================ */
  const introOverlay = document.getElementById('intro-overlay');
  const introVideo   = document.getElementById('intro-video');
  const skipBtn      = document.getElementById('intro-skip');
  const mainContent  = document.getElementById('main-content');

  /**
   * Dismiss the intro overlay with a smooth fade, then unlock the
   * main page content and kick off the envelope animation.
   */
  function dismissIntro() {
    // Fade out the overlay
    introOverlay.classList.add('fade-out');

    // After the CSS transition ends, remove the overlay from the DOM
    // so it no longer blocks interaction or tab order.
    introOverlay.addEventListener('transitionend', () => {
      introOverlay.style.display = 'none';
    }, { once: true });

    // Reveal main content
    mainContent.style.opacity = '1';
    mainContent.style.pointerEvents = 'auto';

    // Show "tap to open" hint on the envelope so the user knows it's interactive
    const envelopeScene = document.getElementById('envelope-scene');
    if (envelopeScene) {
      envelopeScene.classList.add('is-ready');
    }
  }

  // Video ended naturally → dismiss
  if (introVideo) {
    introVideo.addEventListener('ended', dismissIntro, { once: true });

    // Fallback: if the video fails to load/play (e.g., unsupported codec,
    // file path error), dismiss automatically after 1 second so the site
    // is never stuck on the overlay.
    introVideo.addEventListener('error', () => {
      console.warn('[Wedding] Intro video failed to load. Skipping intro.');
      dismissIntro();
    }, { once: true });

    // Additional fallback: if video hasn't started playing within 4 s,
    // dismiss (covers cases where autoplay is blocked silently).
    const introTimeout = setTimeout(() => {
      if (introVideo.paused || introVideo.readyState < 2) {
        console.warn('[Wedding] Intro video did not autoplay. Dismissing overlay.');
        dismissIntro();
      }
    }, 4000);

    // Cancel the timeout if the video plays normally
    introVideo.addEventListener('playing', () => clearTimeout(introTimeout), { once: true });
  } else {
    // No video element found — show site immediately
    dismissIntro();
  }

  // Skip button
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (introVideo) {
        introVideo.pause();
      }
      dismissIntro();
    });
  }


  /* ============================================================
     2. ENVELOPE ANIMATION — toggleable open / close
     Same opening sequence and timing as before; closing plays the
     same steps in reverse so the experience stays consistent.
       OPEN:  seal hides (500ms) → flap opens (800ms) → letter rises (1800ms)
       CLOSE: letter slides back (0ms) → flap closes (1500ms) → seal returns (2900ms)
  ============================================================ */
  const envelopeFlap   = document.getElementById('envelope-flap');
  const envelopeLetter = document.getElementById('envelope-letter');
  const envelopeSeal   = document.getElementById('envelope-seal');
  const heroSubtitle   = document.getElementById('hero-subtitle');

  let envelopeOpen          = false;
  let envelopeTransitioning = false;
  const envelopeTimers      = [];
  function clearEnvelopeTimers() {
    while (envelopeTimers.length) clearTimeout(envelopeTimers.pop());
  }
  function schedule(fn, ms) { envelopeTimers.push(setTimeout(fn, ms)); }

  function openEnvelope() {
    if (envelopeOpen || envelopeTransitioning) return;
    envelopeOpen = true;
    envelopeTransitioning = true;
    clearEnvelopeTimers();

    // Step 1 — Hide wax seal (it "breaks" as flap opens)
    schedule(() => envelopeSeal && envelopeSeal.classList.add('is-hidden'), 500);

    // Step 2 — Open the flap
    schedule(() => envelopeFlap && envelopeFlap.classList.add('is-open'), 800);

    // Step 3 — Rise the letter card
    schedule(() => envelopeLetter && envelopeLetter.classList.add('is-open'), 1800);

    // Step 4 — Show "Scroll to explore" subtitle (if it exists)
    schedule(() => heroSubtitle && heroSubtitle.classList.add('is-visible'), 3200);

    // Release the lock once everything has finished animating
    schedule(() => { envelopeTransitioning = false; }, 3400);
  }

  function closeEnvelope() {
    if (!envelopeOpen || envelopeTransitioning) return;
    envelopeOpen = false;
    envelopeTransitioning = true;
    clearEnvelopeTimers();

    // Reverse sequence: letter goes back first, then flap closes, then seal returns
    if (envelopeLetter) envelopeLetter.classList.remove('is-open');
    schedule(() => envelopeFlap && envelopeFlap.classList.remove('is-open'), 1500);
    schedule(() => envelopeSeal && envelopeSeal.classList.remove('is-hidden'), 2900);
    schedule(() => { envelopeTransitioning = false; }, 3200);
  }

  function toggleEnvelope() {
    if (envelopeOpen) closeEnvelope();
    else              openEnvelope();
  }


  /* ============================================================
     3. SCROLL-REVEAL ANIMATIONS
     Uses IntersectionObserver to add the 'is-visible' class to
     elements with the 'reveal-item' class as they enter the
     viewport. Staggered via CSS animation-delay set inline.
  ============================================================ */
  const revealElements = document.querySelectorAll('.reveal-item');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Stop observing once revealed (one-shot animation)
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,       // 12% of element must be visible
        rootMargin: '0px 0px -40px 0px', // Trigger slightly before bottom of viewport
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

  } else {
    // Fallback for browsers without IntersectionObserver:
    // make all elements visible immediately.
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }


  /* ============================================================
     4. SMOOTH SCROLL — handle anchor links
     Ensures any <a href="#section"> clicks use smooth scrolling
     even on browsers where CSS scroll-behavior is unsupported.
  ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  /* ============================================================
     5. PARALLAX — subtle depth on the swan background sections
     Gently shifts the background-position as the user scrolls
     for a soft parallax effect without libraries.
  ============================================================ */
  const parallaxImgs = document.querySelectorAll(
    '.details-bg-img, .closing-bg-img'
  );

  function onScroll() {
    parallaxImgs.forEach((img) => {
      const parent = img.closest('.details-section, .closing-section');
      if (!parent) return;

      const rect   = parent.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;

      if (inView) {
        // CHANGED: clamp offset to ±18px max so edges are never exposed.
        // The CSS scale(1.15) provides ~7.5% buffer on each side (~22px on a
        // 300px element), safely absorbing this movement in all directions.
        const rawOffset = (rect.top / window.innerHeight) * 28;
        const offset    = Math.max(-18, Math.min(18, rawOffset));
        // CHANGED: always include scale(1.15) in the transform so the CSS
        // initial scale is not lost when JS takes over the transform property.
        img.style.transform = `scale(1.15) translateY(${offset}px)`;
      }
    });
  }

  // Use passive listener for scroll performance
  window.addEventListener('scroll', onScroll, { passive: true });


  /* ============================================================
     6. GALLERY — subtle hover interaction
     Adds a gentle scale to gallery captions if added later.
     (Gallery hover is already handled in CSS :hover rules)
  ============================================================ */

  // No additional JS needed — pure CSS handles gallery hover


  /* ============================================================
     7. ENVELOPE INTERACTION — tap to toggle open / close
     The envelope no longer opens automatically. Each tap toggles
     between open and closed states, replaying the same animation
     (or its reverse) every time.
  ============================================================ */
  const envelopeScene = document.getElementById('envelope-scene');

  function handleEnvelopeTap() {
    if (envelopeScene) {
      // Drop the "tap to open" hint once the envelope has been interacted with
      envelopeScene.classList.remove('is-ready');
      envelopeScene.classList.add('is-opened');
    }
    toggleEnvelope();
  }

  if (envelopeScene) {
    envelopeScene.addEventListener('click', handleEnvelopeTap);
    envelopeScene.addEventListener('touchstart', (e) => {
      // Touch handler is the primary trigger on touch devices; suppress the
      // synthetic click event that follows so we don't fire toggleEnvelope twice.
      e.preventDefault();
      handleEnvelopeTap();
    }, { passive: false });
    // Keyboard accessibility
    envelopeScene.setAttribute('tabindex', '0');
    envelopeScene.setAttribute('role', 'button');
    envelopeScene.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEnvelopeTap();
      }
    });
  }


  /* ============================================================
     8. PHOTO GALLERY — stacked card deck with swipe support
  ============================================================ */
  const galleryStack = document.getElementById('gallery-stack');

  if (galleryStack) {
    const cards   = Array.from(galleryStack.querySelectorAll('.gallery-card'));
    const dots    = Array.from(document.querySelectorAll('#gallery-dots .gallery-dot'));
    const total   = cards.length;
    let   current = 0;

    function classFor(offset) {
      if (offset === 0) return 'is-active';
      if (offset === 1) return 'is-next';
      if (offset === 2) return 'is-next2';
      return 'is-hidden';
    }

    function applyLayout() {
      cards.forEach((card, i) => {
        const offset = (i - current + total) % total;
        card.className = 'gallery-card ' + classFor(offset);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function advance(dir) {
      current = (current + dir + total) % total;
      applyLayout();
    }

    const btnNext = document.getElementById('gallery-next');
    const btnPrev = document.getElementById('gallery-prev');
    if (btnNext) btnNext.addEventListener('click', () => advance(1));
    if (btnPrev) btnPrev.addEventListener('click', () => advance(-1));

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        current = parseInt(dot.dataset.goto, 10);
        applyLayout();
      });
    });

    /* Swipe support */
    let touchStartX = null;
    galleryStack.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    galleryStack.addEventListener('touchend', e => {
      if (touchStartX === null) return;
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 42) advance(diff > 0 ? 1 : -1);
      touchStartX = null;
    }, { passive: true });

    /* Click on active card also advances */
    galleryStack.addEventListener('click', () => advance(1));
  }


  /* ============================================================
     9. RSVP SUBMISSION → Google Apps Script
     Collects every field on the RSVP form, POSTs it as JSON to a
     Google Apps Script Web App which appends a row to the linked
     Google Sheet. The submit button is disabled while the request
     is in flight and a status line below the button confirms the
     result (or surfaces an error).
  ============================================================ */

  // -------- CONFIG: paste your deployed Apps Script Web App URL here --------
  const RSVP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzdL7qV2CBBkhlFqq3HUVZI51o5332WZxrwiDRVY2Ed9-r-scebE2jDo4YXUaIUXD-8/exec";
  // --------------------------------------------------------------------------

  const rsvpForm   = document.getElementById('rsvp-form');
  const rsvpStatus = document.getElementById('rsvp-status');

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitBtn = rsvpForm.querySelector('button[type="submit"]');
      const formData  = new FormData(rsvpForm);

      // Build the payload — one entry per RSVP field plus a client timestamp
      const payload = {
        timestamp: new Date().toISOString(),
        name:      (formData.get('name')   || '').trim(),
        guests:    (formData.get('guests') || '').toString(),
        attending: formData.get('attending') || '',
        side:      formData.get('side')      || '',
        invitedBy: formData.getAll('invitedBy').join(', ')
      };

      // Minimal client-side guard: name must not be empty
      if (!payload.name) {
        showStatus('Խնդրում ենք լրացնել Ձեր անունը:', 'error');
        return;
      }

      const originalLabel = submitBtn.textContent;
      submitBtn.disabled  = true;
      submitBtn.textContent = 'Ուղարկվում է...';
      showStatus('', null);

      try {
        // text/plain body + no-cors avoids the CORS preflight that Apps
        // Script doesn't satisfy. The response is opaque; if fetch resolves
        // without throwing, the request reached the server.
        await fetch(RSVP_SCRIPT_URL, {
          method: 'POST',
          mode:   'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        showStatus('Շնորհակալություն! Ձեր պատասխանը ստացվել է:', 'success');
        rsvpForm.reset();
      } catch (err) {
        console.error('[RSVP] submit failed:', err);
        showStatus('Չհաջողվեց ուղարկել: Խնդրում ենք կրկին փորձել:', 'error');
      } finally {
        submitBtn.disabled  = false;
        submitBtn.textContent = originalLabel;
      }
    });
  }

  function showStatus(message, kind) {
    if (!rsvpStatus) return;
    rsvpStatus.textContent = message;
    rsvpStatus.classList.remove('is-success', 'is-error', 'is-visible');
    if (!message) return;
    if (kind === 'success') rsvpStatus.classList.add('is-success');
    if (kind === 'error')   rsvpStatus.classList.add('is-error');
    rsvpStatus.classList.add('is-visible');
  }

}); // end DOMContentLoaded
