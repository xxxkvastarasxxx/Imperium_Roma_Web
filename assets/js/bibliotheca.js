/**
 * Bibliotheca — library index page script
 * Renders article cards (linking to their own static pages under /bibliotheca/<slug>/)
 * and handles client-side search + category filtering.
 * Article content itself lives in each article's own index.html for indexability.
 */

const BIBLIO_ARTICLES = [
    {
        slug: "how-were-roman-coins-made",
        title: "How Were Roman Coins Made? Inside the Imperial Mint",
        date: "August 2026",
        category: "minting",
        categoryLabel: "Minting & Iconography",
        excerpt: "Hand-cut dies, cast blanks and a single hammer blow — how Rome made coin by the billion, and what the process leaves on the coin."
    },
    {
        slug: "how-to-store-roman-coins",
        title: "How to Store Ancient Roman Coins Safely",
        date: "August 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Which holder materials are safe, why PVC and oak destroy coins, and the humidity level that keeps bronze stable."
    },
    {
        slug: "where-to-buy-roman-coins",
        title: "Where to Buy Ancient Roman Coins Safely",
        date: "August 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "The four channels for buying Roman coins, how to vet a seller in five minutes, and the listing red flags to avoid."
    },
    {
        slug: "roman-silver-debasement",
        title: "How the Denarius Lost Its Silver: Roman Debasement Explained",
        date: "August 2026",
        category: "coins",
        categoryLabel: "Coins & Denominations",
        excerpt: "From 98 per cent fine to a silver-washed token in under three centuries — the story of Roman debasement."
    },
    {
        slug: "why-are-roman-coins-so-cheap",
        title: "Why Are Ancient Roman Coins So Cheap?",
        date: "July 2026",
        category: "history",
        categoryLabel: "History",
        excerpt: "A genuine 1,800-year-old coin for the price of a meal. The reason is supply — and it is more interesting than it sounds."
    },
    {
        slug: "what-does-sc-mean-on-roman-coins",
        title: "What Does SC Mean on a Roman Coin?",
        date: "July 2026",
        category: "minting",
        categoryLabel: "Minting & Iconography",
        excerpt: "SC means Senatus Consulto, by decree of the Senate. Why it marks brass and bronze but never imperial gold or silver."
    },
    {
        slug: "how-to-clean-roman-coins",
        title: "Should You Clean an Ancient Roman Coin? Almost Always, No",
        date: "July 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Cleaning is the fastest way to destroy a Roman coin value. What is safe, what is not, and the one exception."
    },
    {
        slug: "is-it-legal-to-own-roman-coins",
        title: "Is It Legal to Buy and Own Ancient Roman Coins?",
        date: "July 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Collecting Roman coins is legal in most countries — provided the coin left its country of origin lawfully. Here is what that means."
    },
    {
        slug: "how-to-identify-a-roman-coin",
        title: "How to Identify a Roman Coin in Six Steps",
        date: "June 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "A repeatable method for naming and dating an unidentified Roman coin, from metal and weight to the mint mark."
    },
    {
        slug: "how-much-is-a-roman-coin-worth",
        title: "How Much Is a Roman Coin Worth? A Realistic Price Guide",
        date: "June 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Indicative price bands by denomination and grade, the five factors that set value, and how to check real sold prices."
    },
    {
        slug: "is-my-roman-coin-real",
        title: "How to Tell If a Roman Coin Is Real: 9 Checks You Can Do at Home",
        date: "June 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Nine practical checks — weight, magnetism, edge seams, surface texture, style — that catch most fake Roman coins."
    },
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
