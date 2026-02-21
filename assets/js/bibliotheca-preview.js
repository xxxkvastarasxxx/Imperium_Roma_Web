/**
 * Bibliotheca Preview — dynamically renders recent article cards
 * into #bibliotheca-preview on the homepage.
 */
document.addEventListener("DOMContentLoaded", function () {
    const articles = [
        {
            title: "Denarius: The Silver Standard of Rome",
            date: "February 2026",
            excerpt: "Struck for over five centuries, the denarius was the backbone of Roman commerce — learn its origins, evolution, and iconography.",
            slug: "denarius-silver-standard"
        },
        {
            title: "Reading Coin Legends: A Beginner's Guide",
            date: "February 2026",
            excerpt: "Latin inscriptions on Roman coins reveal emperors, tribunes, and victories. Decode the abbreviations step by step.",
            slug: "reading-coin-legends"
        },
        {
            title: "Aureus vs Denarius: The Coin Hierarchy",
            date: "January 2026",
            excerpt: "From the humble as to the prestigious aureus — understand the full spectrum of Roman denomination and value.",
            slug: "aureus-vs-denarius"
        }
    ];

    const container = document.getElementById("bibliotheca-preview");
    if (!container) return;

    container.innerHTML = articles.map(function (a) {
        return `<a href="/bibliotheca/?doc=${a.slug}" target="_blank" rel="noopener noreferrer" class="bibliotheca-card">
            <h3>${a.title}</h3>
            <span class="biblio-arrow">&rarr;</span>
        </a>`;
    }).join("");
});
