/**
 * Bibliotheca — library index page script
 * Renders article cards (linking to their own static pages under /bibliotheca/<slug>/)
 * and handles client-side search + category filtering.
 * Article content itself lives in each article's own index.html for indexability.
 *
 * Languages: BIBLIO_ARTICLES is the English source of truth. BIBLIO_I18N holds the
 * translated title and excerpt per locale; when the page language has an entry for a
 * slug, the card shows that text and links to /<lang>/bibliotheca/<slug>/. A slug with
 * no entry falls back to the English card and the English article, so a half-translated
 * library never produces a dead link.
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

// Translated card text per locale, keyed by slug. Keep in step with the pages under
// /<lang>/bibliotheca/ — an entry here promises that the translated page exists.
const BIBLIO_I18N = {
    uk: {
        "how-were-roman-coins-made": {
            title: "Як карбували римські монети? Усередині імперського монетного двору",
            excerpt: "Вирізані вручну штемпелі, литі заготовки й один удар молота — як Рим карбував монети мільярдами і які сліди цей процес лишає на монеті."
        },
        "how-to-store-roman-coins": {
            title: "Як безпечно зберігати античні римські монети",
            excerpt: "Які матеріали холдерів безпечні, чому ПВХ і дуб руйнують монети, і яка вологість зберігає бронзу стабільною."
        },
        "where-to-buy-roman-coins": {
            title: "Де безпечно купити античні римські монети",
            excerpt: "Чотири канали купівлі римських монет, як за п’ять хвилин перевірити продавця та які ознаки оголошення мають насторожити."
        },
        "roman-silver-debasement": {
            title: "Як денарій втратив своє срібло: римське псування монети",
            excerpt: "Від 98 % срібла до посрібленого жетона менш ніж за три століття — історія римського псування монети."
        },
        "why-are-roman-coins-so-cheap": {
            title: "Чому античні римські монети такі дешеві?",
            excerpt: "Справжня монета віком 1800 років за ціною обіду. Причина — у пропозиції, і вона цікавіша, ніж здається."
        },
        "what-does-sc-mean-on-roman-coins": {
            title: "Що означає SC на римській монеті?",
            excerpt: "SC означає Senatus Consulto — за рішенням Сенату. Чому це позначення є на латуні та бронзі, але ніколи — на імперському золоті чи сріблі."
        },
        "how-to-clean-roman-coins": {
            title: "Чи варто чистити античну римську монету? Майже завжди — ні",
            excerpt: "Чищення — найшвидший спосіб знищити вартість римської монети. Що безпечно, що ні, і єдиний виняток."
        },
        "is-it-legal-to-own-roman-coins": {
            title: "Чи законно купувати та володіти античними римськими монетами?",
            excerpt: "Колекціонувати римські монети законно в більшості країн — за умови, що монета законно залишила країну походження. Що це означає на практиці."
        },
        "how-to-identify-a-roman-coin": {
            title: "Як ідентифікувати римську монету за шість кроків",
            excerpt: "Повторюваний метод, щоб назвати й датувати невизначену римську монету: від металу та ваги до знака монетного двору."
        },
        "how-much-is-a-roman-coin-worth": {
            title: "Скільки коштує римська монета? Реалістичний ціновий орієнтир",
            excerpt: "Орієнтовні цінові діапазони за номіналом і станом, п’ять чинників, що визначають вартість, і як перевірити реальні ціни продажу."
        },
        "is-my-roman-coin-real": {
            title: "Як зрозуміти, чи справжня римська монета: 9 перевірок удома",
            excerpt: "Дев’ять практичних перевірок — вага, магнетизм, шов на гурті, фактура поверхні, стиль — які виявляють більшість підробок."
        },
        "denarius-silver-standard": {
            title: "Денарій: срібний стандарт Риму",
            excerpt: "Карбований понад п’ять століть, денарій був основою римської торгівлі — його походження, еволюція та іконографія."
        },
        "reading-coin-legends": {
            title: "Читаємо легенди монет: посібник для початківців",
            excerpt: "Латинські написи на римських монетах розповідають про імператорів, трибунські повноваження та перемоги. Розшифровуємо скорочення крок за кроком."
        },
        "aureus-vs-denarius": {
            title: "Ауреус проти денарія: ієрархія монет",
            excerpt: "Від скромного аса до престижного ауреуса — повний спектр римських номіналів та їхньої вартості."
        },
        "mint-marks-and-workshops": {
            title: "Знаки монетних дворів та офіцини: читаємо контрольні позначки",
            excerpt: "Літери в екзергу монети — під основним зображенням — точно вказують, де й коли її відкарбували. Як їх розшифрувати."
        },
        "roman-portraiture-on-coins": {
            title: "Імператорський портрет: як імператори формували свій образ",
            excerpt: "Портрет на римській монеті був продуманою політичною заявою. Як імператори використовували мистецтво та образи, щоб транслювати владу по всій імперії."
        },
        "coin-grading-guide": {
            title: "Грейдинг римських монет: від Fine до Mint State",
            excerpt: "Ступінь збереженості визначає ринкову вартість і привабливість монети. Стандартні грейди для античних римських монет і на що звертати увагу."
        }
    }
};

// ---- Initialise ----
document.addEventListener("DOMContentLoaded", function () {
    // Localised strings injected by the build (window.I18N); English literals are the fallback.
    const T = (window.I18N && window.I18N.js) || {};
    const t = function (key, fallback, vars) {
        return String(T[key] !== undefined ? T[key] : fallback)
            .replace(/\{(\w+)\}/g, function (m, n) { return vars && n in vars ? vars[n] : m; });
    };
    const LANG = (window.I18N && window.I18N.lang) || "en";
    const TRANSLATED = BIBLIO_I18N[LANG] || {};

    // The card as the reader should see it: translated text and URL when this
    // language has the article, the English original otherwise.
    const localise = (a) => {
        const tr = TRANSLATED[a.slug];
        return {
            slug: a.slug,
            title: tr ? tr.title : a.title,
            excerpt: tr ? tr.excerpt : a.excerpt,
            href: tr ? "/" + LANG + "/bibliotheca/" + a.slug + "/" : "/bibliotheca/" + a.slug + "/",
            date: a.date.replace(/^[A-Za-z]+/, (m) => t("biblio.month." + m, m)),
            category: a.category,
            categoryLabel: t("biblio.cat." + a.category, a.categoryLabel),
            // Cards not yet translated read as English even on a translated index.
            lang: tr ? LANG : "en"
        };
    };
    const ARTICLES = BIBLIO_ARTICLES.map(localise);

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
        const filtered = ARTICLES.filter(function (a) {
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
                const langAttr = a.lang !== LANG ? ` lang="${a.lang}"` : "";
                return `<a class="biblio-article-card" href="${a.href}"${langAttr}>
                    <div class="biblio-article-meta">
                        <span class="biblio-article-date">${a.date}</span>
                        <span class="biblio-article-category">${a.categoryLabel}</span>
                    </div>
                    <h2>${a.title}</h2>
                    <p>${a.excerpt}</p>
                    <span class="biblio-read-more">${t('biblio.read', 'Read article →')}</span>
                </a>`;
            }).join("");
        }
    }
});
