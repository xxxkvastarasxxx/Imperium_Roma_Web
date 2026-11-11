/**
 * Legal pages: the "On this page" contents list.
 *
 * The list is a <details> that ships open, so it is fully usable without JS.
 * On desktop it stays open (the toggle is hidden by policies.css); on phones it
 * starts collapsed above the text and folds away again after a link is tapped.
 * While reading, the link for the section in view is marked aria-current.
 */
(function () {
    "use strict";

    var toc = document.querySelector(".policy-toc");
    if (!toc) return;

    var desktop = window.matchMedia("(min-width: 961px)");
    var syncOpen = function () { toc.open = desktop.matches; };
    syncOpen();
    if (desktop.addEventListener) desktop.addEventListener("change", syncOpen);
    else if (desktop.addListener) desktop.addListener(syncOpen);

    toc.addEventListener("click", function (e) {
        if (!desktop.matches && e.target.closest && e.target.closest("a")) toc.open = false;
    });

    if (!("IntersectionObserver" in window)) return;

    var links = {};
    toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
        links[a.getAttribute("href").slice(1)] = a;
    });
    var current = null;
    var mark = function (id) {
        if (current === id || !links[id]) return;
        if (current && links[current]) links[current].removeAttribute("aria-current");
        links[id].setAttribute("aria-current", "true");
        current = id;
    };

    // A section counts as "being read" once its top passes the upper third of
    // the viewport (below the fixed header).
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) mark(entry.target.id);
        });
    }, { rootMargin: "-100px 0px -66% 0px" });

    Object.keys(links).forEach(function (id) {
        var section = document.getElementById(id);
        if (section) observer.observe(section);
    });
})();
