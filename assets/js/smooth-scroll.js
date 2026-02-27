/**
 * smooth-scroll.js
 * Global smooth-scroll & page-transition effects for Imperium Roma.
 *
 * Features:
 *  1. Native CSS smooth-scroll on <html>
 *  2. Smooth anchor scrolling for all in-page #hash links
 *  3. Fade-in on page load
 *  4. Fade-out transition before navigating to internal pages
 */

(function () {
    "use strict";

    /* ── 1. Ensure smooth-scroll on <html> ──────────────────────── */
    document.documentElement.style.scrollBehavior = "smooth";

    /* ── 2. Page-transition CSS (injected once) ─────────────────── */
    const style = document.createElement("style");
    style.textContent =
        "body{opacity:0;transition:opacity .35s ease}" +
        "body.ir-visible{opacity:1}" +
        "body.ir-fade-out{opacity:0}";
    document.head.appendChild(style);

    /* ── 3. Fade-in on DOMContentLoaded ─────────────────────────── */
    function fadeIn() {
        document.body.classList.add("ir-visible");
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fadeIn);
    } else {
        fadeIn();
    }

    /* ── 4. Smooth anchor scrolling (in-page #links) ────────────── */
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

    /* ── 5. Fade-out before navigating to internal links ────────── */
    document.addEventListener("click", function (e) {
        var link = e.target.closest("a");
        if (!link) return;

        var href = link.getAttribute("href");
        if (!href) return;

        // Skip hash-only links, external links, javascript: links, new-tab links
        if (
            href.startsWith("#") ||
            href.startsWith("javascript") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            link.target === "_blank" ||
            link.hasAttribute("download") ||
            e.ctrlKey || e.metaKey || e.shiftKey
        ) {
            return;
        }

        // Only apply fade-out for internal (same-origin) links
        try {
            var url = new URL(href, location.origin);
            if (url.origin !== location.origin) return;
        } catch (_) {
            return;
        }

        e.preventDefault();
        document.body.classList.add("ir-fade-out");
        document.body.classList.remove("ir-visible");

        setTimeout(function () {
            window.location.href = href;
        }, 300);
    });

    /* ── 6. Handle back/forward cache (bfcache) ─────────────────── */
    window.addEventListener("pageshow", function (e) {
        if (e.persisted) {
            // Page restored from bfcache — remove fade-out, show again
            document.body.classList.remove("ir-fade-out");
            document.body.classList.add("ir-visible");
        }
    });
})();
