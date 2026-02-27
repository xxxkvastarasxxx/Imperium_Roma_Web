/**
 * smooth-scroll.js
 * Global smooth-scroll for Imperium Roma.
 *
 * Features:
 *  1. Native CSS smooth-scroll on <html>
 *  2. Smooth anchor scrolling for all in-page #hash links
 */

(function () {
    "use strict";

    /* ── 1. Ensure smooth-scroll on <html> ──────────────────────── */
    document.documentElement.style.scrollBehavior = "smooth";

    /* ── 2. Smooth anchor scrolling (in-page #links) ────────────── */
    document.addEventListener("click", function (e) {
        var link = e.target.closest('a[href*="#"]');
        if (!link) return;

        var href = link.getAttribute("href");
        // Only handle pure hash links or same-page hash links
        if (!href || href === "#") return;

        var hashIndex = href.indexOf("#");
        var path = href.substring(0, hashIndex);
        var hash = href.substring(hashIndex);

        // If there's a path portion, only handle it if it matches the current page
        if (path && path !== "" && !location.href.replace(location.hash, "").endsWith(path)) {
            return; // let the browser navigate normally
        }

        var target = document.querySelector(hash);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            // Update URL hash without jump
            history.pushState(null, "", hash);
        }
    });
})();
