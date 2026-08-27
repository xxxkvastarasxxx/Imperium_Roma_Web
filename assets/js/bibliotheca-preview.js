/**
 * Bibliotheca Preview — dynamically renders recent article cards
 * into #bibliotheca-preview on the homepage.
 */
document.addEventListener("DOMContentLoaded", function () {
    const articles = [
        {
            title: "Where to Buy Ancient Roman Coins Safely",
            date: "August 2026",
            excerpt: "The four channels for buying Roman coins, how to vet a seller in five minutes, and the listing red flags to avoid.",
            slug: "where-to-buy-roman-coins"
        },
        {
            title: "How the Denarius Lost Its Silver: Roman Debasement Explained",
            date: "August 2026",
            excerpt: "From 98 per cent fine to a silver-washed token in under three centuries — the story of Roman debasement.",
            slug: "roman-silver-debasement"
        },
        {
            title: "Why Are Ancient Roman Coins So Cheap?",
            date: "July 2026",
            excerpt: "A genuine 1,800-year-old coin for the price of a meal. The reason is supply — and it is more interesting than it sounds.",
            slug: "why-are-roman-coins-so-cheap"
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
