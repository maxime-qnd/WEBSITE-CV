/* qndesign — interactions légères, sans dépendance */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Année du copyright */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* Bordure de la navigation une fois la page défilée */
  var nav = document.querySelector('[data-nav]');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Hero : profondeur qui suit le pointeur, reflet sur le verre */
  var hero = document.querySelector('[data-hero]');
  var scene = document.querySelector('[data-tilt]');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hero && scene && finePointer && !reducedMotion) {
    var panes = scene.querySelectorAll('.glass');
    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };
    var pointer = null;
    var rafId = null;

    var tick = function () {
      /* interpolation douce vers la cible : le mouvement reste fluide même si la souris saccade */
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;

      scene.style.setProperty('--ry', (current.x * 7).toFixed(3) + 'deg');
      scene.style.setProperty('--rx', (current.y * -6).toFixed(3) + 'deg');
      scene.style.setProperty('--px', current.x.toFixed(4));
      scene.style.setProperty('--py', current.y.toFixed(4));

      if (pointer) {
        Array.prototype.forEach.call(panes, function (pane) {
          var r = pane.getBoundingClientRect();
          pane.style.setProperty('--mx', (pointer.x - r.left).toFixed(1) + 'px');
          pane.style.setProperty('--my', (pointer.y - r.top).toFixed(1) + 'px');
        });
      }

      if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    var schedule = function () {
      if (!rafId) rafId = window.requestAnimationFrame(tick);
    };

    hero.addEventListener('pointermove', function (e) {
      var r = scene.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      target.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    });

    hero.addEventListener('pointerleave', function () {
      target.x = 0;
      target.y = 0;
      schedule();
    });
  }

  /* Hero : timecode qui défile à 25 images/s */
  var tcEl = document.querySelector('[data-timecode]');
  if (tcEl && !reducedMotion) {
    var FPS = 25;
    var startFrames = ((1 * 60 + 12) * 60 + 8) * FPS + 14;   /* 01:12:08:14 */
    var t0 = performance.now();
    var lastFrame = -1;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    var runTimecode = function (now) {
      var frames = startFrames + Math.floor((now - t0) / 1000 * FPS);
      if (frames !== lastFrame) {
        lastFrame = frames;
        var ff = frames % FPS;
        var totalSec = Math.floor(frames / FPS);
        tcEl.textContent = pad(Math.floor(totalSec / 3600) % 24) + ':' + pad(Math.floor(totalSec / 60) % 60) +
                           ':' + pad(totalSec % 60) + ':' + pad(ff);
      }
      window.requestAnimationFrame(runTimecode);
    };
    window.requestAnimationFrame(runTimecode);
  }

  /* Apparition progressive des sections au scroll */
  var revealables = document.querySelectorAll('[data-reveal]');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('is-visible');
    });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(revealables, function (el) {
      observer.observe(el);
    });
  }

  /* Copie de l'adresse e-mail dans le presse-papiers */
  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    var defaultLabel = btn.getAttribute('aria-label') || '';
    var timer;

    btn.addEventListener('click', function () {
      copyToClipboard(btn.getAttribute('data-copy')).then(function () {
        btn.classList.add('is-copied');
        btn.setAttribute('aria-label', 'Adresse copiée');
        btn.setAttribute('title', 'Adresse copiée');

        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          btn.classList.remove('is-copied');
          btn.setAttribute('aria-label', defaultLabel);
          btn.setAttribute('title', defaultLabel);
        }, 2200);
      }).catch(function () {
        /* Copie refusée par le navigateur : on laisse l'utilisateur sélectionner le lien */
        btn.setAttribute('title', 'Copie indisponible — sélectionnez l\'adresse à gauche');
      });
    });
  });

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    /* Repli pour les navigateurs anciens ou les pages non sécurisées */
    return new Promise(function (resolve, reject) {
      var field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();

      try {
        document.execCommand('copy') ? resolve() : reject();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(field);
      }
    });
  }
})();
