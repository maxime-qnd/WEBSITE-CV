/* QN Design — interactions légères, sans dépendance */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  /* Année du copyright */
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ---------------------------------------------------------
     Apparition progressive des sections au scroll
     --------------------------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');

  function markDone(el) {
    /* Après l'entrée, on rend aux cartes des transitions de survol réactives */
    var done = function (e) {
      if (e && e.target !== el) return;
      el.classList.add('is-done');
      el.removeEventListener('transitionend', done);
    };
    el.addEventListener('transitionend', done);
  }

  if (reducedMotion || !('IntersectionObserver' in window)) {
    each(revealables, function (el) { el.classList.add('is-visible', 'is-done'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          markDone(entry.target);
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    each(revealables, function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     Navigation : fond en verre au scroll, menu mobile, lien actif
     --------------------------------------------------------- */
  var nav = document.querySelector('[data-nav]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var hero = document.querySelector('[data-hero]');
  var heroContent = hero && hero.querySelector('.hero__content');

  function setMenu(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    each(nav.querySelectorAll('.nav__links a'), function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;
      if (nav) nav.classList.toggle('is-scrolled', y > 24);
      /* Le contenu du hero s'estompe doucement en quittant l'écran */
      if (heroContent && !reducedMotion) {
        var progress = Math.min(Math.max(y / (hero.offsetHeight * 0.8), 0), 1);
        heroContent.style.setProperty('--scroll', progress.toFixed(3));
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    var navLinks = {};
    each(document.querySelectorAll('.nav__links a[href^="#"]'), function (a) {
      navLinks[a.getAttribute('href').slice(1)] = a;
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = navLinks[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          each(document.querySelectorAll('.nav__links a.is-active'), function (a) { a.classList.remove('is-active'); });
          link.classList.add('is-active');
        } else {
          link.classList.remove('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(navLinks).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------------------------------------------------------
     Hero : parallaxe au pointeur + carte en verre inclinable
     --------------------------------------------------------- */
  var card = document.querySelector('[data-tilt]');

  if (hero && finePointer && !reducedMotion) {
    var target = { x: 0, y: 0, gx: 30, gy: 0 };
    var current = { x: 0, y: 0, gx: 30, gy: 0 };
    var tiltActive = false;
    var rafId = null;

    hero.addEventListener('pointermove', function (e) {
      var rect = hero.getBoundingClientRect();
      /* Orbes et puces : valeurs de -1 à 1, lissées par les transitions CSS */
      hero.style.setProperty('--hx', (((e.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
      hero.style.setProperty('--hy', (((e.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));

      if (card) {
        var c = card.getBoundingClientRect();
        var px = (e.clientX - c.left) / c.width;
        var py = (e.clientY - c.top) / c.height;
        /* L'inclinaison est plus forte quand le pointeur survole la carte */
        tiltActive = px >= 0 && px <= 1 && py >= 0 && py <= 1;
        var strength = tiltActive ? 12 : 4;
        target.x = (0.5 - Math.min(Math.max(py, -0.5), 1.5)) * strength;
        target.y = (Math.min(Math.max(px, -0.5), 1.5) - 0.5) * strength;
        target.gx = px * 100;
        target.gy = py * 100;
        loop();
      }
    });

    hero.addEventListener('pointerleave', function () {
      hero.style.setProperty('--hx', '0');
      hero.style.setProperty('--hy', '0');
      target.x = 0; target.y = 0; target.gx = 30; target.gy = 0;
      loop();
    });

    /* Interpolation douce vers la cible, arrêtée dès que la carte est immobile */
    var loop = function () {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function step() {
        var still = true;
        ['x', 'y', 'gx', 'gy'].forEach(function (k) {
          var delta = target[k] - current[k];
          current[k] += delta * 0.09;
          if (Math.abs(delta) > 0.01) still = false;
        });
        card.style.setProperty('--rx', current.x.toFixed(2) + 'deg');
        card.style.setProperty('--ry', current.y.toFixed(2) + 'deg');
        card.style.setProperty('--gx', current.gx.toFixed(1) + '%');
        card.style.setProperty('--gy', current.gy.toFixed(1) + '%');
        rafId = still ? null : window.requestAnimationFrame(step);
      });
    };
  }

  /* Halo qui suit le pointeur sur les cartes en verre */
  if (finePointer) {
    each(document.querySelectorAll('.glass'), function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--px', (e.clientX - r.left) + 'px');
        el.style.setProperty('--py', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* Boutons « magnétiques » : ils suivent légèrement le pointeur */
  if (finePointer && !reducedMotion) {
    each(document.querySelectorAll('[data-magnetic]'), function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px');
        btn.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.setProperty('--mx', '0px');
        btn.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------------------------------------------------------
     Bandeau défilant des domaines
     --------------------------------------------------------- */
  var marquee = document.querySelector('[data-marquee]');
  if (marquee && !reducedMotion) {
    var track = marquee.querySelector('.marquee__track');
    marquee.classList.add('is-running');

    /* Assez de copies pour couvrir l'écran le plus large sans trou */
    var copies = Math.max(1, Math.ceil(window.screen.width / Math.max(track.offsetWidth, 1)));
    for (var i = 0; i < copies; i++) {
      var clone = track.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      marquee.appendChild(clone);
    }
  }

  /* ---------------------------------------------------------
     Copie de l'adresse e-mail dans le presse-papiers
     --------------------------------------------------------- */
  each(document.querySelectorAll('[data-copy]'), function (btn) {
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
