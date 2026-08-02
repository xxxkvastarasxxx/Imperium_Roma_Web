/**
 * Bibliotheca — library index page script
 * Renders article cards (linking to their own static pages under /bibliotheca/<slug>/)
 * and handles client-side search + category filtering.
 * Article content itself lives in each article's own index.html for indexability.
 */

const BIBLIO_ARTICLES = [
    {
        slug: "denarius-silver-standard",
        title: "Denarius: The Silver Standard of Rome",
        date: "February 2026",
        category: "coins",
        categoryLabel: "Coins & Denominations",
        excerpt: "Struck for over five centuries, the denarius was the backbone of Roman commerce — learn its origins, evolution, and iconography."
    },
    {
        slug: "reading-coin-legends",
        title: "Reading Coin Legends: A Beginner's Guide",
        date: "February 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Latin inscriptions on Roman coins reveal emperors, tribunes, and victories. Decode the abbreviations step by step."
    },
    {
        slug: "aureus-vs-denarius",
        title: "Aureus vs Denarius: The Coin Hierarchy",
        date: "January 2026",
        category: "coins",
        categoryLabel: "Coins & Denominations",
        excerpt: "From the humble as to the prestigious aureus — understand the full spectrum of Roman denomination and value."
    },
    {
        slug: "mint-marks-and-workshops",
        title: "Mint Marks & Officinae: Reading the Control Marks",
        date: "January 2026",
        category: "minting",
        categoryLabel: "Minting & Iconography",
        excerpt: "The letters in a coin's exergue — beneath the main design — tell us exactly where and when it was struck. Here's how to decipher them."
    },
    {
        slug: "roman-portraiture-on-coins",
        title: "Imperial Portraiture: How Emperors Shaped Their Image",
        date: "December 2025",
        category: "history",
        categoryLabel: "History",
        excerpt: "The portrait on a Roman coin was a deliberate political statement. Discover how emperors used artistry and imagery to project power across the empire."
    },
    {
        slug: "coin-grading-guide",
        title: "Grading Roman Coins: From Fine to Mint State",
        date: "November 2025",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Grading determines a coin's market value and desirability. Learn the standard grades used for ancient Roman coins and what to look for."
    }
];

// ---- Initialise ----
document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("biblio-grid");
    const noResults = document.getElementById("biblio-no-results");
    const searchInput = document.getElementById("biblio-search");
    const tagButtons = document.querySelectorAll(".biblio-tag");

    let activeCategory = "all";
    let searchQuery = "";

    // ---- Pick up ?q= so the homepage SearchAction (schema.org) lands on a pre-filled search ----
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    if (initialQuery) {
        searchInput.value = initialQuery;
        searchQuery = initialQuery.toLowerCase().trim();
    }

    renderGrid();

    // ---- Search ----
    searchInput.addEventListener("input", function () {
        searchQuery = this.value.toLowerCase().trim();
        renderGrid();
    });

    // ---- Category filters ----
    tagButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            tagButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeCategory = btn.dataset.category;
            renderGrid();
        });
    });

    function renderGrid() {
        const filtered = BIBLIO_ARTICLES.filter(function (a) {
            const matchCat = activeCategory === "all" || a.category === activeCategory;
            const matchSearch = searchQuery === "" ||
                a.title.toLowerCase().includes(searchQuery) ||
                a.excerpt.toLowerCase().includes(searchQuery);
            return matchCat && matchSearch;
        });

        if (filtered.length === 0) {
            grid.innerHTML = "";
            noResults.hidden = false;
        } else {
            noResults.hidden = true;
            grid.innerHTML = filtered.map(function (a) {
                return `<a class="biblio-article-card" href="/bibliotheca/${a.slug}/">
                    <div class="biblio-article-meta">
                        <span class="biblio-article-date">${a.date}</span>
                        <span class="biblio-article-category">${a.categoryLabel}</span>
                    </div>
                    <h2>${a.title}</h2>
                    <p>${a.excerpt}</p>
                    <span class="biblio-read-more">Read article →</span>
                </a>`;
            }).join("");
        }
    }
});
