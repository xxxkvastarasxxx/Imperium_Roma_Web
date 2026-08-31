/**
 * Bibliotheca Preview — dynamically renders recent article cards
 * into #bibliotheca-preview on the homepage.
 */
document.addEventListener("DOMContentLoaded", function () {
    const articles = [
        {
            title: "How Were Roman Coins Made? Inside the Imperial Mint",
            date: "August 2026",
            excerpt: "Hand-cut dies, cast blanks and a single hammer blow — how Rome made coin by the billion, and what the process leaves on the coin.",
            slug: "how-were-roman-coins-made"
        },
        {
            title: "How to Store Ancient Roman Coins Safely",
            date: "August 2026",
            excerpt: "Which holder materials are safe, why PVC and oak destroy coins, and the humidity level that keeps bronze stable.",
            slug: "how-to-store-roman-coins"
        },
        {
            title: "Where to Buy Ancient Roman Coins Safely",
            date: "August 2026",
            excerpt: "The four channels for buying Roman coins, how to vet a seller in five minutes, and the listing red flags to avoid.",
            slug: "where-to-buy-roman-coins"
        }
    ];

    const container = document.getElementById("bibliotheca-preview");
    if (!container) return;

    container.innerHTML = articles.map(function (a) {
        return `<a href="/bibliotheca/${a.slug}/" target="_blank" rel="noopener noreferrer" class="bibliotheca-card">
            <h3>${a.title}</h3>
            <span class="biblio-arrow">&rarr;</span>
        </a>`;
    }).join("");
});
