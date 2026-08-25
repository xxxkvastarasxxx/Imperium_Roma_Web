/* ============================================================
   Contact form: example answers that type themselves into the
   placeholder, to show what a useful message looks like.

   Only ever writes to `placeholder` — never to `value` — so the
   field stays genuinely empty, `required` still fires, and nothing
   is submitted that the visitor did not type. Every field keeps its
   own <label>, so this is decoration, not labelling.

   Name and Email are one group driven by a single clock: both are
   rendered from the same 0..1 progress, so the pair always matches
   (Trajan beside trajan@…) instead of drifting apart on separate
   timers and showing a different emperor in each field.
   ============================================================ */
(function () {
    'use strict';

    /* The Five Good Emperors, in reign order. example.com is the
       RFC 2606 reserved domain, so these addresses can never resolve. */
    var EMPERORS = ['Nerva', 'Trajan', 'Hadrian', 'Antoninus Pius', 'Marcus Aurelius'];
    var INBOXES = [
        'nerva@example.com',
        'trajan@example.com',
        'hadrian@example.com',
        'antoninus.pius@example.com',
        'marcus.aurelius@example.com'
    ];

    var GROUPS = [
        {
            targets: [
                { id: 'name', rest: 'Your name', examples: EMPERORS },
                { id: 'email', rest: 'you@example.com', examples: INBOXES }
            ]
        },
        {
            targets: [{
                id: 'message',
                rest: 'Tell us about your coin…',
                examples: [
                    'I have a denarius of Marcus Aurelius I would like authenticated.',
                    'Could you value a sestertius of Trajan from my collection?',
                    'I inherited a small group of Roman coins and cannot identify them.'
                ]
            }]
        }
    ];

    var STEP_MS = 42;    // one unit of progress
    var HOLD_MS = 2000;  // pause on a finished example
    var GAP_MS = 420;    // pause once cleared

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

    GROUPS.forEach(function (group) {
        var targets = group.targets
            .map(function (t) {
                var el = document.getElementById(t.id);
                return el ? { el: el, rest: t.rest, examples: t.examples, settled: false } : null;
            })
            .filter(Boolean);

        if (!targets.length) return;

        // Reduced motion still gets a helpful example, just not an animated one.
        if (reduce.matches) {
            targets.forEach(function (t) { t.el.placeholder = t.examples[0]; });
            return;
        }

        var timer = null;
        var index = 0;
        var unit = 0;        // 0..steps
        var deleting = false;

        function live() {
            return targets.filter(function (t) { return !t.settled; });
        }

        // Longest example in this round decides how many units the round takes,
        // so every field in the group finishes typing at the same moment.
        function steps() {
            return targets.reduce(function (max, t) {
                return Math.max(max, t.examples[index % t.examples.length].length);
            }, 1);
        }

        function render() {
            var total = steps();
            var p = unit / total;
            live().forEach(function (t) {
                var text = t.examples[index % t.examples.length];
                t.el.placeholder = text.slice(0, Math.round(p * text.length));
            });
        }

        function settle(t) {
            if (t.settled) return;
            t.settled = true;
            t.el.placeholder = t.rest;      // leave a plain, non-moving hint
            if (!live().length) clearTimeout(timer);
        }

        function step() {
            if (!live().length) return;
            var total = steps();

            if (!deleting) {
                unit++;
                render();
                if (unit >= total) {
                    deleting = true;
                    timer = setTimeout(step, HOLD_MS);
                    return;
                }
            } else {
                unit--;
                render();
                if (unit <= 0) {
                    deleting = false;
                    index++;
                    timer = setTimeout(step, GAP_MS);
                    return;
                }
            }
            timer = setTimeout(step, STEP_MS);
        }

        // Once someone engages with a field, the animation has done its job and
        // would only distract while they read or type. Other fields carry on.
        targets.forEach(function (t) {
            ['focus', 'input', 'pointerdown'].forEach(function (evt) {
                t.el.addEventListener(evt, function () { settle(t); }, { once: true });
            });
        });

        // Don't animate in a background tab. Clear before rescheduling either
        // way, so repeated visibility changes cannot leave two chains running.
        document.addEventListener('visibilitychange', function () {
            if (!live().length) return;
            clearTimeout(timer);
            if (!document.hidden) timer = setTimeout(step, GAP_MS);
        });

        timer = setTimeout(step, 700);
    });
})();
