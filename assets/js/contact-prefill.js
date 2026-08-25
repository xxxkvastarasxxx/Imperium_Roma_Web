/* ============================================================
   Contact form: preselect the Subject from ?subject=… so the
   "no section for this yet" links on the Services page land
   people on a form that already knows why they came.

   Matching is tolerant of separators and case ("data+parsing",
   "data%20parsing", "Data Parsing" all resolve). Unknown values
   are ignored and the form simply opens as normal.
   ============================================================ */
(function () {
    'use strict';

    var select = document.getElementById('subject');
    if (!select) return;

    var wanted = new URLSearchParams(window.location.search).get('subject');
    if (!wanted) return;

    var norm = function (v) {
        return String(v).toLowerCase().replace(/[^a-z]+/g, '');
    };
    var target = norm(wanted);

    for (var i = 0; i < select.options.length; i++) {
        var opt = select.options[i];
        if (!opt.value) continue;              // skip the "Select a subject" placeholder
        if (norm(opt.value) === target || norm(opt.textContent) === target) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            break;
        }
    }
})();
