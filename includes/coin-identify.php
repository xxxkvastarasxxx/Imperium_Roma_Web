<?php
// Shared by identify-coin.php (the web endpoint) and scripts/compare-coin-models.php
// (offline model comparison), so both run exactly the same pipeline.
// Not web-accessible: the root .htaccess forbids /includes/.
//
// Pipeline (coin_id_run):
//   1. Read & attribute  - Claude looks at the photos and fills a schema that
//                          records observations and legend readings BEFORE the
//                          attribution, plus lookup hints for step 2.
//   2. Catalogue lookup  - every OCRE/CRRO type for the suggested ruler(s) and
//                          denomination(s) is fetched from Nomisma's SPARQL
//                          endpoint (cached 30 days) and ranked locally against
//                          the legends and reverse design that were read.
//   3. Verify            - Claude sees the photos again with the best-ranked
//                          catalogue types (official legends + descriptions)
//                          and may only pick from those ids, so a confirmed
//                          reference always exists in the catalogue.
// Steps 2-3 are best effort: if Nomisma is slow or down the result is returned
// with its references marked unverified rather than failing.

declare(strict_types=1);

/** Models the site may be configured to use, cheapest last. */
const COIN_ID_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-4-5'];
const COIN_ID_DEFAULT_MODEL = 'claude-haiku-4-5'; // cheapest; owner's choice (2026-10-06)

/** Published per-million-token prices (input, output) in USD, for cost reporting only. */
const COIN_ID_PRICES = [
  'claude-opus-5-5'   => [4.0, 20.0],
  'claude-sonnet-5-5' => [2.0, 10.0],
  'claude-haiku-4-5'  => [1.0, 5.0],
];

const COIN_ID_SPARQL = 'https://nomisma.org/query';
const COIN_ID_CACHE_TTL = 30 * 86400;
const COIN_ID_MAX_CANDIDATES = 10;

// ---------------------------------------------------------------- step 1: read

function coin_id_system(string $lang): string {
  $languageName = $lang === 'uk' ? 'Ukrainian' : 'English';
  return <<<TXT
You are an expert numismatist specialising in ancient Roman coinage: Republican, Imperial and Provincial issues, their legends, portraits, reverse types, mint marks and the standard catalogues (RIC, RRC/Crawford, RPC, RSC, Sear). A collector has photographed a coin and wants to know what it is. Work like a careful specialist: observe first, read the legends letter by letter, then attribute. The output fields are ordered so that observations come before conclusions; fill them in that order and let the later fields follow from the earlier ones.

1. OBSERVE (field "observations")
- Metal and module: colour (gold, silver, grey billon, brass, red copper) and apparent size/thickness relative to the design.
- Portrait: male or female, apparent age, beard or none, hair style. Headgear: laureate (laurel wreath), radiate (spiky sun crown), diademed (band, pearls or rosettes), helmeted, or bare-headed. Bust: head only, draped, cuirassed, seen from front or back; anything held. Female busts on a crescent mark a double denomination.
- Reverse design: every figure, its pose (standing, seated, walking), direction, and what it holds; animals, objects, buildings, ships, inscriptions in a wreath.
- Marks: letters or symbols in the field, the exergue line and anything below it (mint and workshop marks), S C, numerals.

2. READ THE LEGENDS (fields "obverse.legend", "reverse.legend")
- Legends usually start at about 7 o'clock and run clockwise around the edge; some continue in the field or the exergue, and some reverse legends are split either side of a figure.
- Transcribe only letters you can actually see, in Latin capitals, with spaces between words as on the coin. Mark illegible or off-flan parts with "…". Do not complete a legend from memory in these fields; your expansion belongs in "reasoning".
- Conventions: V for U, I for J; ligatures (AE, NT, VR) are common; dots or gaps separate words.
- Abbreviations to expect: IMP (imperator), CAES / CAESAR, AVG (Augustus), AVGG (two Augusti), AVGVSTA (empress), P M / PONT MAX (pontifex maximus), TR P / TR POT with a numeral (tribunician power, renewed yearly), COS with a numeral (consulships), P P (pater patriae), PIVS, FEL, P F, DIVVS / DIVO / DIVA / CONSECRATIO (deified, posthumous), NOB C / NOB CAES (Caesar, the heir), D N (dominus noster, late Empire), GERM, DAC, PARTH, ARM, BRIT, SARM (victory titles), S C (senatus consulto, on bronze), DIVI F.

3. ATTRIBUTE
- Name the person from the legend's name elements, confirmed by the portrait. Several rulers share names: ANTONINVS is used by Antoninus Pius, Marcus Aurelius, Commodus, Caracalla and Elagabalus; separate them with the other words (PIVS, AVRELIVS, VERVS, CAESAR, AVG PII F), the titulature, age and beard. A bare-headed young portrait with CAESAR usually means an heir under the reigning emperor.
- Date from the titulature: the TR P and COS numerals pin the year closely; victory titles and P P narrow it.
- Denomination from metal, size and portrait type: gold aureus (to the early 4th century) or solidus (from Constantine); silver denarius (laureate, about 18-20 mm), antoninianus (radiate male / crescent female, from 215), quinarius (small), siliqua (late); bronze sestertius (large, about 30-35 mm, S C), dupondius (radiate, brass) and as (laureate, copper) at about 25-28 mm; later bronzes (follis, nummus, AE1-AE4 by size).
- Mint: until the mid-3rd century most imperial coins are from Rome unless style or legend shows otherwise; from then on read the mint mark (for example TR or PTR Trier, LVG or PLG Lyon, ARL Arles, R or RQ Rome, AQ Aquileia, SIS Siscia, SM, TES Thessalonica, CONS Constantinople, NIC Nicomedia, CYZ Cyzicus, ANT or SMANT Antioch, ALE Alexandria).
- Greek legends mean a Roman Provincial coin (RPC); ROMA and a moneyer's name mean a Republican denarius (RRC/Crawford).

4. CATALOGUE LOOKUP (field "catalogue_lookup", always in English)
- rulers: the issuing authority as catalogues file it, most likely first, up to three. For a coin of a Caesar, empress or other family member list the reigning emperor who issued it as well as the person portrayed (Marcus Aurelius as Caesar: "Antoninus Pius", "Marcus Aurelius"; Julia Domna: "Septimius Severus", "Caracalla"). Use standard English names (Septimius Severus, Marcus Aurelius, Constantine I, Gallienus).
- denominations: lowercase English names, most likely first, up to two (denarius, aureus, antoninianus, sestertius, as, dupondius, quinarius, solidus, follis).
- reverse_type: a short English description of the reverse design in catalogue style, for example "Moneta seated left holding scales and cornucopiae" or "Victory walking left with wreath and palm".

5. HONESTY
- A precise but wrong attribution misleads a collector more than a careful, partial one. Only give a catalogue reference when the visible details support it; otherwise leave "references" empty and say in "notes" what would narrow it.
- Confidence: "high" only when the legends and design agree on a single issue; "medium" when ruler and denomination are clear but the exact issue is not; "low" when it is a best guess. List the strongest alternatives when several issues fit.
- If the photos do not show a coin, or show a coin that is not ancient Roman, say so with is_coin / is_roman_coin and explain briefly in the summary, leaving the other fields null or empty.
- This is an attribution, not an authentication: never declare the coin genuine. If you notice signs of a cast copy or modern replica (soft details, casting seams or pits, wrong style or flan, an implausible legend and type combination), mention them in the notes for an expert to check.

LANGUAGE: write every descriptive field in {$languageName}: observations, the obverse and reverse descriptions, ruler, denomination, metal, mint, date, reasoning, alternatives, notes and summary, using the usual {$languageName} numismatic terms. Exceptions: legends exactly as on the coin (Latin capitals), catalogue references in their standard form (for example "RIC II 147"), and catalogue_lookup and catalogue_query in English.
TXT;
}

function coin_id_schema(): array {
  $str = ['type' => 'string'];
  $nullableString = ['type' => ['string', 'null']];
  $side = [
    'type' => 'object',
    'properties' => [
      'legend'      => $nullableString + ['description' => 'Letters actually visible, Latin capitals, "…" for illegible parts; null if none legible'],
      'description' => $nullableString + ['description' => 'What the side shows (portrait, attributes, reverse type)'],
    ],
    'required' => ['legend', 'description'],
    'additionalProperties' => false,
  ];
  // Property order = generation order: observations and readings first, conclusions last.
  return [
    'type' => 'object',
    'properties' => [
      'is_coin'       => ['type' => 'boolean'],
      'is_roman_coin' => ['type' => 'boolean'],
      'observations'  => [
        'type' => 'object',
        'properties' => [
          'metal_and_module' => $str,
          'portrait'         => $str + ['description' => 'Sex, age, beard, headgear (laureate/radiate/diademed/bare), bust'],
          'reverse_design'   => $str + ['description' => 'Figures, poses, direction, attributes held'],
          'marks'            => $nullableString + ['description' => 'Field letters, exergue, mint/officina marks, S C'],
        ],
        'required' => ['metal_and_module', 'portrait', 'reverse_design', 'marks'],
        'additionalProperties' => false,
      ],
      'obverse'       => $side,
      'reverse'       => $side,
      'ruler'         => $nullableString + ['description' => 'Person who issued the coin or is portrayed'],
      'denomination'  => $nullableString,
      'metal'         => $nullableString,
      'mint'          => $nullableString,
      'date'          => $nullableString + ['description' => 'Date or date range of issue'],
      'catalogue_lookup' => [
        'type' => 'object',
        'properties' => [
          'rulers'        => ['type' => 'array', 'items' => $str, 'description' => 'English names of the issuing authority, most likely first, up to three'],
          'denominations' => ['type' => 'array', 'items' => $str, 'description' => 'Lowercase English denomination names, most likely first, up to two'],
          'reverse_type'  => $nullableString + ['description' => 'Short English catalogue-style description of the reverse design'],
        ],
        'required' => ['rulers', 'denominations', 'reverse_type'],
        'additionalProperties' => false,
      ],
      'references'    => ['type' => 'array', 'items' => $str, 'description' => 'Catalogue references, only when the details support them'],
      'confidence'    => ['type' => 'string', 'enum' => ['high', 'medium', 'low']],
      'reasoning'     => $str + ['description' => 'The visible features the attribution rests on, including the expanded legends, in 2-5 sentences'],
      'alternatives'  => [
        'type' => 'array',
        'items' => [
          'type' => 'object',
          'properties' => ['label' => $str, 'why' => $str],
          'required' => ['label', 'why'],
          'additionalProperties' => false,
        ],
      ],
      'notes' => $nullableString + ['description' => 'Photo quality, what would narrow the attribution, anything an expert should check'],
      'summary' => $str + ['description' => 'One-line attribution, e.g. "Denarius of Trajan, Rome, AD 112-114"'],
      'catalogue_query' => $nullableString + ['description' => 'Short English keyword query for the OCRE catalogue, e.g. "Domitian denarius Minerva". Null if not a Roman coin'],
    ],
    'required' => ['is_coin', 'is_roman_coin', 'observations', 'obverse', 'reverse', 'ruler', 'denomination', 'metal',
                   'mint', 'date', 'catalogue_lookup', 'references', 'confidence', 'reasoning', 'alternatives', 'notes',
                   'summary', 'catalogue_query'],
    'additionalProperties' => false,
  ];
}

/**
 * Image blocks for one or two photos, each labelled.
 * @param array<string, array{0: string, 1: string}> $images side => [mediaType, base64]
 */
function coin_id_image_blocks(array $images): array {
  $content = [];
  foreach ($images as $side => [$mediaType, $data]) {
    $content[] = ['type' => 'text', 'text' => $side === 'obverse' ? 'Obverse (front):' : 'Reverse (back):'];
    $content[] = ['type' => 'image', 'source' => ['type' => 'base64', 'mediaType' => $mediaType, 'data' => $data]];
  }
  return $content;
}

/** Model-specific request options shared by both calls. */
function coin_id_model_options(string $model): array {
  if ($model === 'claude-haiku-4-5') {
    // No effort setting or server-side fallback on Haiku 4.5. Extended thinking
    // was tried (3000-token budget): 3-4x slower, no better legend reading.
    return [];
  }
  // Opus 5.5 / Sonnet 5.5: adaptive thinking by default, high effort, and the
  // server-side refusal fallback (re-run on a fallback model inside the call).
  return [
    'outputConfigExtra' => ['effort' => 'high'],
    'fallbacks' => 'default',
    'betas' => ['server-side-fallback-2026-07-01'],
  ];
}

/** Named arguments for $client->beta->messages->create(...): build from parts + model options. */
function coin_id_build_args(string $model, string $system, array $content, array $schema): array {
  $opts = coin_id_model_options($model);
  $args = [
    'model'     => $model,
    'maxTokens' => 16000,
    'system'    => $system,
    'messages'  => [['role' => 'user', 'content' => $content]],
    'outputConfig' => ['format' => ['type' => 'json_schema', 'schema' => $schema]] + ($opts['outputConfigExtra'] ?? []),
  ];
  unset($opts['outputConfigExtra']);
  return $args + $opts;
}

/** Step 1 request. */
function coin_id_request_args(string $model, string $lang, array $images): array {
  $content = coin_id_image_blocks($images);
  $content[] = ['type' => 'text', 'text' => count($images) === 2
    ? 'Identify this coin from the obverse and reverse photos above.'
    : 'Identify this coin from the photo above (only one side was provided).'];
  return coin_id_build_args($model, coin_id_system($lang), $content, coin_id_schema());
}

/** First text block parsed as JSON, or null. */
function coin_id_parse($message): ?array {
  foreach ($message->content as $block) {
    if ($block->type === 'text') {
      $json = json_decode($block->text, true);
      return is_array($json) ? $json : null;
    }
  }
  return null;
}

// ---------------------------------------------------------------- step 2: catalogue

/** Uppercase Latin letters only, V for U, I for J; gaps and punctuation become spaces. */
function coin_id_norm(?string $s): string {
  $s = strtoupper((string) $s);
  $s = strtr($s, ['U' => 'V', 'J' => 'I']);
  $s = preg_replace('~[^A-Z]+~', ' ', $s);
  return trim(preg_replace('~\s+~', ' ', $s));
}

/** Simple HTTP GET with timeouts; returns body or null. */
function coin_id_http_get(string $url, array $headers, int $timeout): ?string {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT        => $timeout,
    CURLOPT_USERAGENT      => 'ImperiumRoma-CoinID/1.0 (+https://imperiumroma.com)',
  ]);
  $body = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ($body !== false && $code === 200) ? (string) $body : null;
}

/** Clean an English name for a SPARQL string literal. */
function coin_id_sparql_name(string $s): string {
  return trim(preg_replace('~[^a-z \'\-]~', '', strtolower($s)));
}

/**
 * All OCRE/CRRO coin types for the given rulers (and denominations, if any),
 * as compact rows [id, label, mint, start, end, obvLeg, obvDesc, revLeg, revDesc].
 * Cached on disk; null when Nomisma could not be reached.
 */
function coin_id_catalogue_types(array $rulers, array $denominations): ?array {
  $rulers = array_values(array_filter(array_map('coin_id_sparql_name', array_slice($rulers, 0, 3))));
  $denominations = array_values(array_filter(array_map('coin_id_sparql_name', array_slice($denominations, 0, 2))));
  if (!$rulers) return [];
  $key = implode('|', $rulers) . '#' . implode('|', $denominations);
  $dir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ir_nomisma';
  $file = $dir . DIRECTORY_SEPARATOR . sha1($key) . '.json';
  if (is_file($file) && filemtime($file) > time() - COIN_ID_CACHE_TTL) {
    $cached = json_decode((string) @file_get_contents($file), true);
    if (is_array($cached)) return $cached;
  }

  $list = fn(array $names) => implode(', ', array_map(fn($n) => '"' . $n . '"', $names));
  $denFilter = $denominations
    ? "?type nmo:hasDenomination ?den . ?den skos:prefLabel ?dn . FILTER(lang(?dn) = \"en\" && lcase(str(?dn)) IN ({$list($denominations)}))"
    : '';
  $query = <<<SPARQL
PREFIX nmo: <http://nomisma.org/ontology#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX void: <http://rdfs.org/ns/void#>
SELECT ?type ?label ?mint ?start ?end ?obvLeg ?obvDesc ?revLeg ?revDesc WHERE {
  ?person skos:prefLabel ?pn . FILTER(lang(?pn) = "en" && lcase(str(?pn)) IN ({$list($rulers)}))
  # Issuing emperor OR person portrayed: OCRE files heirs, co-emperors and
  # empresses under the reigning emperor (Lucius Verus under Marcus Aurelius).
  { ?type nmo:hasAuthority ?person } UNION { ?type nmo:hasObverse/nmo:hasPortrait ?person }
  ?type skos:prefLabel ?label ; void:inDataset ?ds .
  FILTER(?ds IN (<http://numismatics.org/ocre/>, <http://numismatics.org/crro/>))
  {$denFilter}
  OPTIONAL { ?type nmo:hasMint/skos:prefLabel ?mint . FILTER(lang(?mint) = "en") }
  OPTIONAL { ?type nmo:hasStartDate ?start } OPTIONAL { ?type nmo:hasEndDate ?end }
  OPTIONAL { ?type nmo:hasObverse ?o . OPTIONAL { ?o nmo:hasLegend ?obvLeg } OPTIONAL { ?o dcterms:description ?obvDesc FILTER(lang(?obvDesc) = "en") } }
  OPTIONAL { ?type nmo:hasReverse ?r . OPTIONAL { ?r nmo:hasLegend ?revLeg } OPTIONAL { ?r dcterms:description ?revDesc FILTER(lang(?revDesc) = "en") } }
}
LIMIT 6000
SPARQL;
  $body = coin_id_http_get(COIN_ID_SPARQL . '?query=' . rawurlencode($query),
    ['Accept: application/sparql-results+json'], 20);
  $json = $body !== null ? json_decode($body, true) : null;
  if (!is_array($json) || !isset($json['results']['bindings'])) return null;

  $rows = [];
  foreach ($json['results']['bindings'] as $b) {
    $id = $b['type']['value'];
    if (isset($rows[$id])) continue; // first binding per type is enough
    $v = fn($k) => isset($b[$k]['value']) ? (string) $b[$k]['value'] : null;
    $rows[$id] = [$id, $v('label'), $v('mint'), $v('start'), $v('end'), $v('obvLeg'), $v('obvDesc'), $v('revLeg'), $v('revDesc')];
  }
  $rows = array_values($rows);
  if (!$rows && $denominations) {
    // Denomination name not in the catalogue's vocabulary: retry for the ruler(s) alone.
    return coin_id_catalogue_types($rulers, []);
  }
  // Cache real answers only: an empty one may be a name the model got wrong
  // this time, and must not block the lookup for 30 days.
  if ($rows) {
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    @file_put_contents($file, json_encode($rows));
  }
  return $rows;
}

/** How well a legend as read (with gaps) fits a catalogue legend: 0..1. */
function coin_id_legend_score(string $read, string $cat): float {
  $readTokens = array_values(array_filter(explode(' ', coin_id_norm($read)), fn($t) => strlen($t) >= 2));
  if (!$readTokens || $cat === '') return 0.0;
  $catTokens = explode(' ', coin_id_norm($cat));
  $sum = 0.0;
  foreach ($readTokens as $t) {
    $best = 0.0;
    foreach ($catTokens as $c) {
      if ($t === $c) { $best = 1.0; break; }
      if (strlen($t) >= 3 && (str_starts_with($c, $t) || str_starts_with($t, $c) && strlen($c) >= 3)) $best = max($best, 0.75);
      elseif (strlen($t) >= 4 && levenshtein($t, $c) <= 1) $best = max($best, 0.7);
    }
    $sum += $best;
  }
  $tokenScore = $sum / count($readTokens);
  // Letter-sequence similarity catches word-break differences ("PMTRP" vs "P M TR P")
  similar_text(str_replace(' ', '', coin_id_norm($read)), str_replace(' ', '', coin_id_norm($cat)), $pct);
  return 0.7 * $tokenScore + 0.3 * ($pct / 100);
}

/** Share of the meaningful words of the reverse description that appear in the catalogue's. */
function coin_id_design_score(?string $read, ?string $cat): float {
  static $stop = ['with', 'and', 'the', 'holding', 'right', 'left', 'hand', 'standing', 'seated', 'from', 'each', 'into', 'over'];
  $words = array_unique(array_filter(preg_split('~[^a-z]+~', strtolower((string) $read)),
    fn($w) => strlen($w) >= 4 && !in_array($w, $stop, true)));
  if (!$words || !$cat) return 0.0;
  $cat = strtolower($cat);
  $hit = 0;
  foreach ($words as $w) if (str_contains($cat, rtrim($w, 's'))) $hit++;
  return $hit / count($words);
}

/** Rank catalogue rows against the reading; returns the best few with their score. */
function coin_id_rank(array $rows, array $result): array {
  $obv = (string) ($result['obverse']['legend'] ?? '');
  $rev = (string) ($result['reverse']['legend'] ?? '');
  $design = (string) ($result['catalogue_lookup']['reverse_type'] ?? '');
  $scored = [];
  foreach ($rows as $r) {
    $s = 0.35 * coin_id_legend_score($obv, (string) $r[5])
       + 0.45 * coin_id_legend_score($rev, (string) $r[7])
       + 0.20 * coin_id_design_score($design, $r[8]);
    $scored[] = [$s, $r];
  }
  usort($scored, fn($a, $b) => $b[0] <=> $a[0]);
  return array_slice($scored, 0, COIN_ID_MAX_CANDIDATES);
}

/** Short catalogue id used in prompts and the result (path after /id/). */
function coin_id_short_id(string $uri): string {
  return preg_replace('~^.*/id/~', '', $uri);
}

function coin_id_date_range(?string $start, ?string $end): ?string {
  $fmt = function (?string $y): ?string {
    if ($y === null || $y === '') return null;
    $n = (int) $y;
    return $n < 0 ? (abs($n) . ' BC') : ('AD ' . $n);
  };
  $a = $fmt($start); $b = $fmt($end);
  if ($a && $b && $a !== $b) return $a . '–' . preg_replace('~^AD ~', '', $b);
  return $a ?: $b;
}

// ---------------------------------------------------------------- step 3: verify

function coin_id_verify_system(string $lang): string {
  $languageName = $lang === 'uk' ? 'Ukrainian' : 'English';
  return <<<TXT
You are an expert numismatist checking an attribution against catalogue entries. You see the coin photos, the legends as first read, and a short list of candidate types from the OCRE / CRRO online catalogues with their official legends and descriptions.

Choose only candidates that agree with ALL the visible evidence: the obverse legend, the reverse legend, the reverse design (figures, pose, direction, attributes), the portrait (headgear, bust) and any marks. Look at the photos again to settle disagreements; the first reading may contain mistakes. A legend that is partly illegible is compatible if every visible letter fits the catalogue legend; a candidate whose legend or design contradicts what is visible must be excluded. Many types differ only in a detail (a numeral, bust type, an object held), so check those details.

Return at most three matches, best first, with confidence "high" (legends and design agree with this type and no other listed type fits as well), "medium" (consistent, but another listed type fits about as well or a detail cannot be seen), or "low" (closest listed type, but something cannot be confirmed). Return an empty list if none of the candidates fits. Write "why" and "note" in {$languageName}, briefly, naming the deciding details.
TXT;
}

function coin_id_verify_args(string $model, string $lang, array $images, array $result, array $ranked): array {
  $ids = [];
  $lines = [];
  foreach ($ranked as $i => [$score, $r]) {
    $id = coin_id_short_id($r[0]);
    $ids[] = $id;
    $lines[] = sprintf("[%d] id: %s | %s | %s%s\n    Obverse: %s — %s\n    Reverse: %s — %s",
      $i + 1, $id, $r[1] ?? '', $r[2] ?? 'mint unknown',
      ($d = coin_id_date_range($r[3], $r[4])) ? ', ' . $d : '',
      $r[5] ?? '(no legend)', $r[6] ?? '', $r[7] ?? '(no legend)', $r[8] ?? '');
  }
  $reading = sprintf("First reading:\nObverse legend: %s\nObverse: %s\nReverse legend: %s\nReverse: %s\nMarks: %s",
    $result['obverse']['legend'] ?? '(not legible)', $result['obverse']['description'] ?? '',
    $result['reverse']['legend'] ?? '(not legible)', $result['reverse']['description'] ?? '',
    $result['observations']['marks'] ?? 'none noted');

  $content = coin_id_image_blocks($images);
  $content[] = ['type' => 'text', 'text' => $reading . "\n\nCandidate catalogue types:\n" . implode("\n", $lines)
    . "\n\nWhich of these types is this coin?"];

  $schema = [
    'type' => 'object',
    'properties' => [
      'matches' => [
        'type' => 'array',
        'items' => [
          'type' => 'object',
          'properties' => [
            'id' => ['type' => 'string', 'enum' => $ids],
            'confidence' => ['type' => 'string', 'enum' => ['high', 'medium', 'low']],
            'why' => ['type' => 'string'],
          ],
          'required' => ['id', 'confidence', 'why'],
          'additionalProperties' => false,
        ],
      ],
      'note' => ['type' => ['string', 'null']],
    ],
    'required' => ['matches', 'note'],
    'additionalProperties' => false,
  ];
  return coin_id_build_args($model, coin_id_verify_system($lang), $content, $schema);
}

// ---------------------------------------------------------------- pipeline

/**
 * Run the whole pipeline. Returns ['result' => array|null, 'stop' => string,
 * 'usage' => [in, out], 'calls' => int]. API exceptions from step 1 propagate
 * to the caller; steps 2-3 never throw.
 */
function coin_id_run($client, string $model, string $lang, array $images): array {
  $usage = [0, 0];
  $add = function ($m) use (&$usage) { $usage[0] += (int) $m->usage->inputTokens; $usage[1] += (int) $m->usage->outputTokens; };

  $message = $client->beta->messages->create(...coin_id_request_args($model, $lang, $images));
  $add($message);
  if ($message->stopReason === 'refusal' || $message->stopReason === 'max_tokens') {
    return ['result' => null, 'stop' => (string) $message->stopReason, 'usage' => $usage, 'calls' => 1];
  }
  $result = coin_id_parse($message);
  if ($result === null) return ['result' => null, 'stop' => 'parse', 'usage' => $usage, 'calls' => 1];

  // A legend field must hold letters from the coin, not a sentence about it
  // (smaller models sometimes write "legend not fully legible ..."). Lowercase
  // words mean prose: drop it so it can't mislead the catalogue ranking.
  foreach (['obverse', 'reverse'] as $side) {
    $leg = $result[$side]['legend'] ?? null;
    if (is_string($leg) && preg_match('~\p{Ll}{3,}~u', $leg)) $result[$side]['legend'] = null;
  }

  $result['catalogue'] = ['status' => 'skipped', 'checked' => 0, 'matches' => [], 'note' => null];
  $calls = 1;
  $lookup = $result['catalogue_lookup'] ?? [];
  if (!empty($result['is_roman_coin']) && !empty($lookup['rulers'])) {
    $rows = null;
    try { $rows = coin_id_catalogue_types($lookup['rulers'], $lookup['denominations'] ?? []); } catch (\Throwable $e) { $rows = null; }
    if ($rows === null) {
      $result['catalogue']['status'] = 'unavailable';
    } elseif (!$rows) {
      $result['catalogue']['status'] = 'no_match';
    } else {
      $ranked = coin_id_rank($rows, $result);
      $result['catalogue']['checked'] = count($rows);
      try {
        $verify = $client->beta->messages->create(...coin_id_verify_args($model, $lang, $images, $result, $ranked));
        $add($verify);
        $calls++;
        $sel = $verify->stopReason === 'refusal' ? null : coin_id_parse($verify);
      } catch (\Throwable $e) {
        error_log('identify-coin: verify step failed: ' . $e->getMessage());
        $sel = null;
      }
      if (is_array($sel)) {
        $byId = [];
        foreach ($ranked as [$score, $r]) $byId[coin_id_short_id($r[0])] = $r;
        $matches = [];
        foreach ($sel['matches'] ?? [] as $m) {
          $r = $byId[$m['id'] ?? ''] ?? null;
          if (!$r) continue;
          $matches[] = [
            'id' => coin_id_short_id($r[0]),
            'label' => $r[1],
            'uri' => preg_replace('~^http:~', 'https:', $r[0]),
            'confidence' => $m['confidence'] ?? 'low',
            'why' => $m['why'] ?? '',
            'mint' => $r[2],
            'date' => coin_id_date_range($r[3], $r[4]),
            'obverse_legend' => $r[5],
            'reverse_legend' => $r[7],
            'reverse_description' => $r[8],
          ];
        }
        $result['catalogue']['matches'] = array_slice($matches, 0, 3);
        $result['catalogue']['note'] = $sel['note'] ?? null;
        $result['catalogue']['status'] = $matches ? 'verified' : 'no_match';
        if ($matches) {
          // Confirmed references replace the model's unverified ones
          $result['references'] = array_map(fn($m) => $m['label'], $result['catalogue']['matches']);
          // An exact catalogue match settles the issue: the overall confidence
          // should not read "medium" next to it.
          if (($matches[0]['confidence'] ?? '') === 'high') $result['confidence'] = 'high';
        }
      } else {
        $result['catalogue']['status'] = 'unavailable';
      }
    }
  }
  return ['result' => $result, 'stop' => (string) $message->stopReason, 'usage' => $usage, 'calls' => $calls];
}
