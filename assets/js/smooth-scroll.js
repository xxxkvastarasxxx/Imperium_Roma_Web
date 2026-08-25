/**
 * smooth-scroll.js
 * In-page anchor handling for Imperium Roma.
 *
 * The smoothness itself is CSS now (`html { scroll-behavior: smooth }` in
 * style.css), not set from here. This file used to do:
 *
 *     document.documentElement.style.scrollBehavior = "smooth";
 *
 * which took effect only once the script ran, and — being an inline style —
 * could not be switched off by the `prefers-reduced-motion` media query.
 *
 * What remains is the one thing CSS cannot do: replace the default hash jump
 * with a scroll that does not push a new history entry, so Back returns to the
 * previous page rather than stepping through each anchor visited. The header
 * offset comes from `scroll-margin-top` on `section[id]`, which
 * scrollIntoView() honours.
 */

(function () {
    "use strict";

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    document.addEventListener("click", function (e) {
        // Let modified clicks (new tab/window, download) behave normally.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

        var link = e.target.closest('a[href*="#"]');
        if (!link) return;
        if (link.hasAttribute("download") || link.target === "_blank") return;

        var href = link.getAttribute("href");
        if (!href || href === "#") return;

        var hashIndex = href.indexOf("#");
        var path = href.substring(0, hashIndex);
        var hash = href.substring(hashIndex);

        // With a path portion, only handle it when it is this same page.
        if (path && path !== "" && !location.href.replace(location.hash, "").endsWith(path)) {
            return; // different page — let the browser navigate
        }

        var target;
        try {
            target = document.querySelector(hash);
        } catch (err) {
            return; // not a valid selector (e.g. "#!/foo") — leave it alone
        }
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
            behavior: reduce.matches ? "auto" : "smooth",
            block: "start"
        });

        // replaceState, not pushState: visiting five anchors should not mean
        // five presses of Back to leave the page.
        history.replaceState(null, "", hash);
    });
})();
