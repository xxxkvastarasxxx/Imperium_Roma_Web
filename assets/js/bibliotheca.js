/**
 * Bibliotheca — library page script
 * Renders article cards, handles search, category filtering,
 * and article reading view (URL: /bibliotheca/?doc=slug).
 */

const BIBLIO_ARTICLES = [
    {
        slug: "denarius-silver-standard",
        title: "Denarius: The Silver Standard of Rome",
        date: "February 2026",
        category: "coins",
        categoryLabel: "Coins & Denominations",
        excerpt: "Struck for over five centuries, the denarius was the backbone of Roman commerce — learn its origins, evolution, and iconography.",
        content: `
            <h1>Denarius: The Silver Standard of Rome</h1>
            <div class="article-meta">
                <span>February 2026</span>
                <span style="color:#666">Coins &amp; Denominations</span>
            </div>
            <p>The <em>denarius</em> (plural: <em>denarii</em>) was the standard silver coin of ancient Rome, first minted around 211 BC during the Second Punic War. Its name derives from the Latin <em>deni</em>, meaning "containing ten", a reference to its original value of ten <em>asses</em>.</p>
            <h2>Origins and the Republican Period</h2>
            <p>The earliest denarii were struck from high-purity silver (around 95–98%) and featured the helmeted head of Roma on the obverse and the Dioscuri — Castor and Pollux — on the reverse. These powerful imagery choices spoke directly to Roman military identity and religious devotion.</p>
            <p>As the Republican period matured, moneyers — magistrates responsible for the mint — began using the coin's reverses as a canvas for family propaganda, depicting ancestors' achievements, mythological scenes, and allusions to political victories.</p>
            <h2>The Imperial Transformation</h2>
            <p>Under Augustus, the denarius was reformed and stabilised at approximately 3.9 grams of silver. Portrait coins now displayed the emperor's likeness, transforming the coin into an instrument of imperial communication — spreading the emperor's image and titulature to every corner of the empire.</p>
            <blockquote>"The denarius was not just currency; it was a proclamation, a portable monument of imperial power." — Numismatic History of Rome</blockquote>
            <h2>Debasement and Decline</h2>
            <p>From the 3rd century AD onward, successive emperors reduced the silver content of the denarius to fund military campaigns and government expenses. By the reign of Gallienus (253–268 AD), the coin had become little more than a bronze coin with a thin silver wash — a transformation that contributed to the currency crisis of the 3rd century.</p>
            <h2>Reading a Denarius</h2>
            <ul>
                <li><strong>Obverse (Heads):</strong> Imperial portrait with abbreviated titulature, reading clockwise from the top.</li>
                <li><strong>Reverse (Tails):</strong> Deity, personification, or commemorative scene, with associated legend.</li>
                <li><strong>Weight:</strong> Classical denarii range from 3.2 to 4.5 grams depending on period and ruler.</li>
                <li><strong>Diameter:</strong> Typically 17–20 mm.</li>
            </ul>
            <p>Understanding the denarius is the gateway to understanding Roman numismatics. Its five-century history mirrors the rise, peak, and transformation of Roman civilisation itself.</p>
        `
    },
    {
        slug: "reading-coin-legends",
        title: "Reading Coin Legends: A Beginner's Guide",
        date: "February 2026",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Latin inscriptions on Roman coins reveal emperors, tribunes, and victories. Decode the abbreviations step by step.",
        content: `
            <h1>Reading Coin Legends: A Beginner's Guide</h1>
            <div class="article-meta">
                <span>February 2026</span>
                <span style="color:#666">Collector Guides</span>
            </div>
            <p>The inscriptions (legends) on Roman coins are written in Latin and packed with abbreviated titles. Once you crack the code, a coin reads like a miniature biography of the emperor or a snapshot of a political moment.</p>
            <h2>The Basics of Roman Legends</h2>
            <p>Roman coin legends run clockwise from roughly the 7 o'clock position on the obverse. They typically include the emperor's name (in the nominative, genitive, or dative case), along with a sequence of honorific titles — all abbreviated.</p>
            <h2>Common Abbreviations Decoded</h2>
            <ul>
                <li><strong>IMP</strong> — <em>Imperator</em>: Commander-in-Chief; later adopted as the equivalent of "Emperor"</li>
                <li><strong>CAES</strong> — <em>Caesar</em>: The dynastic title, later indicating a junior emperor or heir</li>
                <li><strong>AVG</strong> — <em>Augustus</em>: The supreme title of the emperor, meaning "revered" or "majestic"</li>
                <li><strong>PM</strong> — <em>Pontifex Maximus</em>: High Priest; the emperor's religious authority</li>
                <li><strong>TR P</strong> — <em>Tribunicia Potestas</em>: Tribunician Power; renewed annually, useful for dating coins</li>
                <li><strong>COS</strong> — <em>Consul</em>: The traditional magistracy, often numbered (e.g. COS III = Third Consulship)</li>
                <li><strong>PP</strong> — <em>Pater Patriae</em>: Father of the Fatherland</li>
                <li><strong>SC</strong> — <em>Senatus Consulto</em>: By decree of the Senate (seen on bronze coins)</li>
            </ul>
            <h2>A Practical Example</h2>
            <p>Take the legend: <strong>IMP CAES NERVA TRAIANVS AVG GER DAC P M TR P COS V P P</strong></p>
            <p>This reads: Imperator Caesar Nerva Trajanus Augustus, Germanicus, Dacicus, Pontifex Maximus, Tribunician Power, Consul for the fifth time, Father of the Fatherland. This is Emperor Trajan — a single legend places him precisely in time and documents his major victories.</p>
            <h2>Dating Coins with TR P</h2>
            <p>The <em>Tribunicia Potestas</em> was renewed each year on a specific day (usually 10 December). Numismatists use the TR P number to narrow down the mint date of a coin, often to within a 12-month window — an invaluable tool for research.</p>
            <h2>Reverse Legends</h2>
            <p>Reverse legends name the deity, personification, or event depicted. Common reverses include <em>LIBERTAS AVG</em> (Liberty of the Emperor), <em>VICTORIA AVG</em> (Victory of the Emperor), and <em>PROVIDENTIA</em> (Foresight).</p>
            <p>With practice, reading a legend becomes second nature. Start with well-documented emperors like Augustus, Trajan, or Hadrian — their coins are abundant and thoroughly catalogued in RIC (Roman Imperial Coinage).</p>
        `
    },
    {
        slug: "aureus-vs-denarius",
        title: "Aureus vs Denarius: The Coin Hierarchy",
        date: "January 2026",
        category: "coins",
        categoryLabel: "Coins & Denominations",
        excerpt: "From the humble as to the prestigious aureus — understand the full spectrum of Roman denomination and value.",
        content: `
            <h1>Aureus vs Denarius: The Coin Hierarchy</h1>
            <div class="article-meta">
                <span>January 2026</span>
                <span style="color:#666">Coins &amp; Denominations</span>
            </div>
            <p>Roman coinage was not a single coin — it was a carefully structured system of denominations in gold, silver, and bronze, each serving a different economic role across the empire.</p>
            <h2>The Full Denomination System (Early Imperial)</h2>
            <ul>
                <li><strong>Aureus</strong> (gold) — valued at 25 denarii; used for major transactions and military pay</li>
                <li><strong>Quinarius Aureus</strong> (gold) — half-aureus, valued at 12.5 denarii; rarer in circulation</li>
                <li><strong>Denarius</strong> (silver) — the standard monetary unit; equivalent to a legionary soldier's daily wage</li>
                <li><strong>Quinarius</strong> (silver) — half-denarius; relatively uncommon</li>
                <li><strong>Sestertius</strong> (brass/orichalcum) — large, handsome coin valued at ¼ denarius; favoured for official propaganda</li>
                <li><strong>Dupondius</strong> (brass) — valued at ½ sestertius or 2 asses</li>
                <li><strong>As</strong> (copper) — the base bronze coin; 4 asses = 1 sestertius</li>
                <li><strong>Semis</strong> (copper) — half-as</li>
                <li><strong>Quadrans</strong> (copper) — quarter-as; the smallest denomination</li>
            </ul>
            <h2>The Aureus</h2>
            <p>First introduced in the late 3rd century BC, the gold aureus became the pre-eminent denomination under Julius Caesar and Augustus. Weighing approximately 7.8 grams under Augustus (later reduced over time), it circulated among the wealthy, officials, and as the primary payment to the military.</p>
            <p>The aureus was replaced by the <em>solidus</em> — introduced by Constantine I around 309 AD — which itself became the backbone of Byzantine monetary systems for centuries.</p>
            <h2>The Sestertius: Large and Impressive</h2>
            <p>Though lower in denomination than the denarius, the sestertius was physically the largest coin in the Roman system. Its size made it ideal for detailed engraving — many sestertii feature some of the finest artistry in numismatic history, from architectural depictions to narrative battle scenes.</p>
            <h2>How Much Was a Denarius Worth?</h2>
            <p>In the 1st century AD, a denarius roughly equated to: one day's wages for a labourer or soldier; a litre of wine (common variety); three loaves of bread. This context dramatically changes how we read coin hoards — a pot of 300 denarii represented nearly a year's salary for an ordinary citizen.</p>
            <blockquote>"The denarius and the aureus were the heartbeat of a Mediterranean economy that stretched from Hadrian's Wall to the Euphrates." </blockquote>
        `
    },
    {
        slug: "mint-marks-and-workshops",
        title: "Mint Marks & Officinae: Reading the Control Marks",
        date: "January 2026",
        category: "minting",
        categoryLabel: "Minting & Iconography",
        excerpt: "The letters in a coin's exergue — beneath the main design — tell us exactly where and when it was struck. Here's how to decipher them.",
        content: `
            <h1>Mint Marks &amp; Officinae: Reading the Control Marks</h1>
            <div class="article-meta">
                <span>January 2026</span>
                <span style="color:#666">Minting &amp; Iconography</span>
            </div>
            <p>During the later Roman Empire (3rd–5th centuries AD), every coin was stamped with a mark in the exergue — the small section beneath the reverse design — that revealed the mint city and workshop (officina) where it was struck. These marks are an invaluable research tool.</p>
            <h2>The Exergue</h2>
            <p>The exergue is the lower segment of the reverse, separated from the main design by a horizontal line. It typically contains a mint mark composed of two or three elements:</p>
            <ul>
                <li><strong>Mint letters</strong> — abbreviation of the city name (e.g. ANT = Antioch, LVG = Lugdunum/Lyon, CONS = Constantinople)</li>
                <li><strong>Officina number</strong> — indicating workshop number, usually in Greek (A, B, Γ, Δ…) or Latin (P = Prima, S = Secunda, T = Tertia…)</li>
                <li><strong>Field marks</strong> — additional symbols or letters flanking the main design, sometimes indicating issues or batches</li>
            </ul>
            <h2>Major Mint Cities</h2>
            <ul>
                <li>R (or ROMA) — Rome</li>
                <li>CONST (or C) — Constantinople</li>
                <li>ANT — Antioch</li>
                <li>SIRM — Sirmium</li>
                <li>SISSCIA — Siscia (modern Sisak, Croatia)</li>
                <li>LVG — Lugdunum (Lyon, France)</li>
                <li>ARL — Arelate (Arles, France)</li>
                <li>TR — Trier (Germany)</li>
            </ul>
            <h2>Why It Matters for Collectors</h2>
            <p>Identifying the mint of a coin helps date it, understand its context, and assess rarity. Certain mint/officina combinations were struck in small numbers — making a TR officina coin potentially much rarer than the same type from the Rome mint.</p>
            <p>Cross-referencing mint marks with resources like the online <em>Roman Imperial Coinage</em> database (numismatics.org) or Wildwinds allows collectors to pinpoint a coin to within a few years of its issue.</p>
        `
    },
    {
        slug: "roman-portraiture-on-coins",
        title: "Imperial Portraiture: How Emperors Shaped Their Image",
        date: "December 2025",
        category: "history",
        categoryLabel: "History",
        excerpt: "The portrait on a Roman coin was a deliberate political statement. Discover how emperors used artistry and imagery to project power across the empire.",
        content: `
            <h1>Imperial Portraiture: How Emperors Shaped Their Image</h1>
            <div class="article-meta">
                <span>December 2025</span>
                <span style="color:#666">History</span>
            </div>
            <p>Before mass media, the Roman coin was the most widely distributed image in the world. For the vast majority of the empire's population — who would never visit Rome, let alone see the emperor in person — the coin portrait was the emperor's face.</p>
            <h2>Realism vs Idealisation</h2>
            <p>Early Imperial portraiture (1st century AD) tended toward idealisation — Augustus, for instance, was consistently depicted as youthful and serene, even as he aged into his seventies. This was a conscious choice: the emperor as permanent, stable, almost divine.</p>
            <p>The Flavian dynasty (69–96 AD) introduced a shift toward verism — more realistic portraiture with individual features. Coins of Vespasian show his characteristic humour and no-nonsense appearance; those of Domitian reveal growing tension and megalomania.</p>
            <h2>Hairstyles as Dating Tools</h2>
            <p>The hairstyle of an empress or emperor was not merely stylistic — it changed with fashion and was deliberately updated on coins. Collectors and scholars use the evolution of Faustina the Elder's or Sabina's hairstyle to date coins with remarkable precision.</p>
            <h2>The Radiate Crown</h2>
            <p>From the 3rd century AD onward, emperors were increasingly depicted wearing a radiate crown — a spiked sun-ray diadem. On bronze coinage, the radiate crown indicated the coin was a double <em>as</em> (dupondius). On silver, it appeared on the new <em>antoninianus</em>, worth two denarii.</p>
            <blockquote>"The coin portrait was the ancient world's mass media — every transaction, every soldier's pay packet, carried the emperor's face."</blockquote>
            <h2>Reading the Portrait</h2>
            <p>When examining a portrait, note: the direction faced (usually right for emperors, left was sometimes used to distinguish junior emperors or caesars); the presence of a laurel wreath (military triumph); a diadem (late imperial, divine kingship); armour or civilian dress (military vs civil emphasis).</p>
        `
    },
    {
        slug: "coin-grading-guide",
        title: "Grading Roman Coins: From Fine to Mint State",
        date: "November 2025",
        category: "guides",
        categoryLabel: "Collector Guides",
        excerpt: "Grading determines a coin's market value and desirability. Learn the standard grades used for ancient Roman coins and what to look for.",
        content: `
            <h1>Grading Roman Coins: From Fine to Mint State</h1>
            <div class="article-meta">
                <span>November 2025</span>
                <span style="color:#666">Collector Guides</span>
            </div>
            <p>Unlike modern coin grading (which uses the 1–70 Sheldon scale), ancient Roman coins are graded using descriptive terminology. Understanding these grades is essential for buying, selling, and assessing your collection.</p>
            <h2>Standard Grade Terminology</h2>
            <ul>
                <li><strong>Mint State (MS) / Uncirculated:</strong> Essentially no wear, full original lustre or surface intact. Extremely rare for ancient coins.</li>
                <li><strong>Extremely Fine (EF / XF):</strong> Light wear on the highest points only. All details sharp and well-defined. Highly desirable.</li>
                <li><strong>Very Fine (VF):</strong> Moderate wear on raised surfaces. Most details still clear. The most common grade for quality collection coins.</li>
                <li><strong>Fine (F):</strong> Considerable wear, but all major features visible. Legends readable. The "workhorse" of affordable collecting.</li>
                <li><strong>Very Good (VG):</strong> Heavy wear; main design elements visible but flat. Legend may be partially legible.</li>
                <li><strong>Good (G):</strong> Very heavy wear. Design outlined but flat. Date and legend faint or partially missing.</li>
                <li><strong>Fair / Poor:</strong> Barely identifiable. Historical interest only.</li>
            </ul>
            <h2>Factors That Affect Grade (and Value)</h2>
            <ul>
                <li><strong>Centering:</strong> Is the design centred on the flan, or is part of the design off-flan?</li>
                <li><strong>Strike quality:</strong> Was the coin struck with a fresh die? Weak strikes reduce apparent grade.</li>
                <li><strong>Flan quality:</strong> Cracks, porosity, cleaning, or corrosion all reduce desirability.</li>
                <li><strong>Patina:</strong> Original undisturbed patina is highly valued; harsh cleaning destroys it and dramatically reduces value.</li>
                <li><strong>Tone:</strong> On silver coins, attractive toning can add premium; unpleasant toning detracts.</li>
            </ul>
            <h2>A Note on Cleaning</h2>
            <p>Never clean a Roman coin with abrasives or chemicals. Professional conservation to stabilise active corrosion is acceptable; aggressive polishing or scratch-removal destroys both patina and value. When in doubt — do nothing.</p>
            <p>For newly acquired coins with earthen deposits, gentle soaking in distilled water for several days followed by careful brushing with a soft toothbrush is the safest approach.</p>
        `
    }
];

// ---- Initialise ----
document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("biblio-grid");
    const noResults = document.getElementById("biblio-no-results");
    const readingPane = document.getElementById("biblio-reading-pane");
    const articleContent = document.getElementById("biblio-article-content");
    const backBtn = document.getElementById("biblio-back-btn");
    const searchInput = document.getElementById("biblio-search");
    const tagButtons = document.querySelectorAll(".biblio-tag");

    let activeCategory = "all";
    let searchQuery = "";

    // ---- Check for ?doc= deep link ----
    const params = new URLSearchParams(window.location.search);
    const docSlug = params.get("doc");
    if (docSlug) {
        const article = BIBLIO_ARTICLES.find(a => a.slug === docSlug);
        if (article) {
            showArticle(article);
            return;
        }
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

    // ---- Back button ----
    backBtn.addEventListener("click", function () {
        readingPane.hidden = true;
        document.querySelector(".biblio-filter-section").hidden = false;
        document.querySelector(".biblio-articles-section").hidden = false;
        history.pushState({}, "", "/bibliotheca/");
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
                return `<article class="biblio-article-card" data-slug="${a.slug}" tabindex="0" role="button" aria-label="Read article: ${a.title}">
                    <div class="biblio-article-meta">
                        <span class="biblio-article-date">${a.date}</span>
                        <span class="biblio-article-category">${a.categoryLabel}</span>
                    </div>
                    <h2>${a.title}</h2>
                    <p>${a.excerpt}</p>
                    <span class="biblio-read-more">Read article →</span>
                </article>`;
            }).join("");

            grid.querySelectorAll(".biblio-article-card").forEach(function (card) {
                card.addEventListener("click", function () {
                    const art = BIBLIO_ARTICLES.find(a => a.slug === card.dataset.slug);
                    if (art) showArticle(art);
                });
                card.addEventListener("keydown", function (e) {
                    if (e.key === "Enter" || e.key === " ") {
                        card.click();
                    }
                });
            });
        }
    }

    function showArticle(article) {
        articleContent.innerHTML = article.content;
        document.querySelector(".biblio-filter-section").hidden = true;
        document.querySelector(".biblio-articles-section").hidden = true;
        readingPane.hidden = false;
        // Scroll directly to the reading pane, not the top of the page
        readingPane.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState({}, "", `/bibliotheca/?doc=${article.slug}`);
    }

    window.addEventListener("popstate", function () {
        const p = new URLSearchParams(window.location.search);
        const s = p.get("doc");
        if (s) {
            const art = BIBLIO_ARTICLES.find(a => a.slug === s);
            if (art) { showArticle(art); return; }
        }
        readingPane.hidden = true;
        document.querySelector(".biblio-filter-section").hidden = false;
        document.querySelector(".biblio-articles-section").hidden = false;
    });

});
