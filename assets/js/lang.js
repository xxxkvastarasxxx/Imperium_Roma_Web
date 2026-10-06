/* ============================================================
   Language switcher memory + first-visit suggestion.

   The build injects `window.I18N` into every public page with the
   current locale, the URL of this page in each other locale, and
   the short banner text each locale wants shown to visitors whose
   browser prefers it.

   Deliberately no automatic redirect: search engines index every
   language at its own URL and crawl with a fixed Accept-Language,
   so a redirect would hide pages from them and annoy anyone who
   followed a link on purpose. Instead, a visitor whose browser
   prefers another available language is offered it once, in that
   language, and the answer is remembered.
   ============================================================ */
(function () {
    'use strict';

    // Header dropdown: open/close on the globe button, close on outside click
    // or Escape, arrow keys move between languages. Same behaviour in the
    // mobile overlay, where the CSS just opens the list upwards instead.
    var menu = document.querySelector('[data-lang-menu]');
    if (menu) {
        var toggle = menu.querySelector('.lang-menu__toggle');
        var items = menu.querySelectorAll('.lang-menu__list a');
        var setOpen = function (open) {
            menu.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        };
        toggle.addEventListener('click', function () {
            var open = !menu.classList.contains('is-open');
            setOpen(open);
            if (open && items.length) {
                var cur = menu.querySelector('.lang-menu__list a[aria-current]') || items[0];
                cur.focus();
            }
        });
        document.addEventListener('click', function (e) {
            if (!menu.contains(e.target)) setOpen(false);
        });
        menu.addEventListener('focusout', function (e) {
            if (e.relatedTarget && !menu.contains(e.relatedTarget)) setOpen(false);
        });
        menu.addEventListener('keydown', function (e) {
            if (!menu.classList.contains('is-open')) return;
            if (e.key === 'Escape') {
                e.stopPropagation(); // close just this, not the mobile overlay too
                setOpen(false);
                toggle.focus();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                var idx = Array.prototype.indexOf.call(items, document.activeElement);
                var next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
                items[(next + items.length) % items.length].focus();
            }
        });
    }

    var I = window.I18N;
    if (!I || !I.locales || !I.alt) return;

    var KEY = 'ir-lang';
    var store = {
        get: function () { try { return localStorage.getItem(KEY); } catch (_) { return null; } },
        set: function (v) { try { localStorage.setItem(KEY, v); } catch (_) { /* private mode */ } }
    };

    // An explicit choice in the header switcher is the strongest signal we have.
    var links = document.querySelectorAll('.lang-menu__list a[data-lang]');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function () {
            store.set(this.getAttribute('data-lang'));
        });
    }

    // Already answered (or chose) once: never nag again.
    if (store.get()) return;

    // First browser language we actually have a version of.
    var langs = navigator.languages || [navigator.language || navigator.userLanguage || ''];
    var preferred = null;
    for (var j = 0; j < langs.length && !preferred; j++) {
        var code = String(langs[j]).toLowerCase().split('-')[0];
        if (I.locales[code]) preferred = code;
    }
    if (!preferred || preferred === I.lang) return;

    var meta = I.locales[preferred];
    var target = I.alt[preferred];
    if (!meta || !meta.banner || !target) return;

    var banner = document.createElement('div');
    banner.className = 'lang-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('lang', preferred);
    banner.setAttribute('aria-label', meta.name);

    var text = document.createElement('span');
    text.className = 'lang-banner__text';
    text.textContent = meta.banner.text;

    var actions = document.createElement('span');
    actions.className = 'lang-banner__actions';

    var cta = document.createElement('a');
    cta.className = 'lang-banner__cta';
    cta.href = target;
    cta.hreflang = preferred;
    cta.textContent = meta.banner.cta;
    cta.addEventListener('click', function () { store.set(preferred); });

    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'lang-banner__dismiss';
    dismiss.textContent = meta.banner.dismiss;
    dismiss.addEventListener('click', function () {
        store.set(I.lang);
        banner.remove();
    });

    actions.appendChild(cta);
    actions.appendChild(dismiss);
    banner.appendChild(text);
    banner.appendChild(actions);
    document.body.appendChild(banner);
})();
