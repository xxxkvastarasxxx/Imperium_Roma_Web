/**
 * Bibliotheca Preview — dynamically renders recent article cards
 * into #bibliotheca-preview on the homepage.
 *
 * Each article carries its translations inline; a language without one falls back
 * to the English title and the English article URL.
 */
document.addEventListener("DOMContentLoaded", function () {
    const articles = [
        {
            slug: "how-were-roman-coins-made",
            title: "How Were Roman Coins Made? Inside the Imperial Mint",
            i18n: { uk: "Як карбували римські монети? Усередині імперського монетного двору" }
        },
        {
            slug: "how-to-store-roman-coins",
            title: "How to Store Ancient Roman Coins Safely",
            i18n: { uk: "Як безпечно зберігати античні римські монети" }
        },
        {
            slug: "where-to-buy-roman-coins",
            title: "Where to Buy Ancient Roman Coins Safely",
            i18n: { uk: "Де безпечно купити античні римські монети" }
        }
    ];

    const container = document.getElementById("bibliotheca-preview");
    if (!container) return;

    const LANG = (window.I18N && window.I18N.lang) || "en";

    container.innerHTML = articles.map(function (a) {
        const translated = a.i18n && a.i18n[LANG];
        const title = translated || a.title;
        const href = translated ? "/" + LANG + "/bibliotheca/" + a.slug + "/" : "/bibliotheca/" + a.slug + "/";
        const langAttr = translated || LANG === "en" ? "" : ' lang="en"';
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="bibliotheca-card"${langAttr}>
            <h3>${title}</h3>
            <span class="biblio-arrow">&rarr;</span>
        </a>`;
    }).join("");
});
