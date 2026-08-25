/**
 * faq.js
 * Smooth open/close for the <details> FAQ accordions.
 *
 * Native <details> snaps to its full height the instant it opens, which shoves
 * everything below it down in a single frame — the "jump". Here we intercept the
 * toggle, keep the element open for the whole transition, and animate its height
 * from the current value to the measured target so the surrounding layout moves
 * gradually instead of teleporting.
 *
 * Falls back to the plain native behaviour when the Web Animations API is missing
 * or the visitor has asked for reduced motion.
 */

(function () {
    "use strict";

    var SELECTOR = ".services-faq details, .domus-faq details";
    var DURATION = 260;
    var EASING = "cubic-bezier(.22, 1, .36, 1)";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function Accordion(el) {
        this.el = el;
        this.summary = el.querySelector("summary");
        this.animation = null;
        this.isClosing = false;
        this.isExpanding = false;

        if (!this.summary) return;
        this.summary.addEventListener("click", this.onClick.bind(this));
    }

    Accordion.prototype.onClick = function (e) {
        // Let modified clicks and in-answer links behave normally.
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;

        e.preventDefault();

        if (reduceMotion.matches) {
            this.el.open = !this.el.open;
            return;
        }

        this.el.style.overflow = "hidden";

        if (this.isClosing || !this.el.open) {
            this.open();
        } else {
            this.shrink();
        }
    };

    /* Measure the collapsed height by briefly flipping `open` off. No paint
       happens between the two writes, so this is invisible to the user. */
    Accordion.prototype.shrink = function () {
        this.isClosing = true;

        var startHeight = this.el.offsetHeight + "px";
        this.el.open = false;
        var endHeight = this.el.offsetHeight + "px";
        this.el.open = true;

        this.animate(startHeight, endHeight, false);
    };

    Accordion.prototype.open = function () {
        // Lock the current height first so the browser has something to animate
        // from once `open` expands the content.
        this.el.style.height = this.el.offsetHeight + "px";
        this.el.open = true;
        window.requestAnimationFrame(this.expand.bind(this));
    };

    Accordion.prototype.expand = function () {
        this.isExpanding = true;

        var startHeight = this.el.offsetHeight + "px";
        this.el.style.height = "auto";
        var endHeight = this.el.offsetHeight + "px";
        this.el.style.height = startHeight;

        this.animate(startHeight, endHeight, true);
    };

    Accordion.prototype.animate = function (from, to, openWhenDone) {
        if (this.animation) this.animation.cancel();

        this.animation = this.el.animate(
            { height: [from, to] },
            { duration: DURATION, easing: EASING }
        );

        var self = this;
        this.animation.onfinish = function () { self.reset(openWhenDone); };
        this.animation.oncancel = function () {
            self.isClosing = false;
            self.isExpanding = false;
        };
    };

    Accordion.prototype.reset = function (open) {
        this.el.open = open;
        this.animation = null;
        this.isClosing = false;
        this.isExpanding = false;
        this.el.style.height = "";
        this.el.style.overflow = "";
    };

    function init() {
        if (typeof Element === "undefined" || !Element.prototype.animate) return;
        var items = document.querySelectorAll(SELECTOR);
        for (var i = 0; i < items.length; i++) new Accordion(items[i]);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
