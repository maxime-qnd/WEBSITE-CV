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
