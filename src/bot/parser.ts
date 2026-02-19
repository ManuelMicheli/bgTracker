export interface ParsedMessage {
  amount: number;
  description: string;
  type: 'expense' | 'income';
  suggestedCategory: string | null;
}

// Keywords/patterns that indicate income
const INCOME_PATTERNS = [
  'stipendio', 'ricevuto', 'arrivat', 'entrata', 'guadagnat', 'bonifico',
  'accredito', 'rimborso', 'incassat', 'compenso', 'premio', 'vendut',
  'riscoss', 'mi hanno dat', 'mi hanno pagat', 'ho ricevuto', 'mi è arrivat',
  'mi sono arrivat', 'hanno accreditat', 'entrat',
];

// Category keyword mapping — longer/more specific keywords take priority
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Abbonamenti: [
    'netflix', 'spotify', 'disney+', 'disney plus', 'prime video',
    'amazon prime', 'dazn', 'sky', 'now tv', 'youtube premium',
    'apple music', 'apple tv', 'playstation plus', 'ps plus', 'xbox gamepass',
    'gamepass', 'crunchyroll', 'abbonamento', 'rinnovo',
    'tim', 'vodafone', 'windtre', 'wind', 'tre', 'iliad', 'ho mobile',
    'very mobile', 'postemobile', 'fastweb', 'fibra', 'internet',
    'palestra', 'gym', 'fitness', 'icloud', 'google one', 'dropbox',
    'chatgpt', 'openai', 'claude', 'canva', 'adobe', 'microsoft 365',
    'office 365', 'antivirus', 'bolletta', 'luce', 'gas', 'acqua',
    'enel', 'eni gas', 'a2a', 'hera', 'iren', 'sorgenia', 'acea',
  ],
  Cibo: [
    'spesa', 'supermercato', 'supermarket', 'alimentari', 'esselunga', 'conad',
    'lidl', 'carrefour', 'coop', 'eurospin', 'penny', 'aldi', 'pam',
    'despar', 'tigre', 'simply', 'todis', 'tuodi', 'famila', 'iper',
    'ipercoop', 'bennet', 'interspar', 'sigma', 'decò',
    'mercato', 'fruttivendolo', 'macelleria', 'panetteria', 'panificio',
    'gastronomia', 'surgelati', 'alimentare',
    'pizza', 'pizzeria', 'ristorante', 'cena', 'pranzo', 'sushi',
    'hamburger', 'mcdonalds', 'mcdonald', 'burger king', 'kfc',
    'kebab', 'bar', 'caffè', 'caffe', 'cappuccino', 'cornetto', 'brioche',
    'aperitivo', 'apericena', 'colazione', 'brunch', 'pub', 'trattoria',
    'osteria', 'paninoteca', 'gelateria', 'gelato', 'pasticceria',
    'deliveroo', 'glovo', 'justeat', 'just eat', 'uber eats',
    'mangiato fuori', 'panino', 'piadina', 'focaccia',
    'tavola calda', 'rosticceria', 'pokè', 'poke',
  ],
  Za: [
    'zara', 'h&m', 'primark', 'shein', 'vestiti', 'scarpe',
    'abbigliamento', 'maglietta', 'pantaloni', 'giacca', 'felpa',
    'amazon', 'acquisto online', 'online', 'shopping',
    'cinema', 'film', 'concerto', 'teatro', 'museo', 'mostra', 'evento',
    'videogioco', 'gioco', 'steam', 'playstation', 'ps5', 'ps4',
    'nintendo', 'switch', 'xbox', 'libro', 'libreria', 'fumetto', 'manga',
    'hobby', 'sport', 'partita', 'stadio', 'biglietto', 'ingresso',
    'parco', 'bowling', 'escape room', 'karaoke', 'discoteca', 'festa',
    'compleanno', 'regalo', 'farmacia', 'medicina', 'medicinale',
    'dottore', 'medico', 'visita', 'dentista', 'oculista', 'psicologo',
    'fisioterapia', 'esame', 'analisi', 'ospedale', 'integratore',
    'parrucchiere', 'barbiere', 'estetista', 'manicure', 'massaggio',
    'veterinario', 'cane', 'gatto', 'mangime',
  ],
  Tabacchi: [
    'tabaccaio', 'tabacchi', 'tabaccheria', 'sigarette', 'sigaro',
    'iqos', 'vape', 'gratta', 'grattino', 'lotto', 'scommessa',
    'edicola', 'giornale', 'rivista',
  ],
  'Casa e Macchina': [
    'affitto', 'condominio', 'ikea', 'mobili', 'mobile', 'elettrodomestico',
    'riparazione', 'idraulico', 'elettricista', 'pulizie', 'detersivo',
    'tari', 'spazzatura', 'rifiuti', 'mutuo', 'rata', 'arredamento',
    'leroy merlin', 'brico', 'bricocenter', 'ferramenta', 'vernice',
    'lavatrice', 'lavastoviglie', 'forno', 'frigorifero', 'condizionatore',
    'riscaldamento', 'caldaia', 'assicurazione auto', 'meccanico',
    'gomme', 'tagliando', 'revisione', 'officina', 'carrozziere',
    'bollo auto', 'multa', 'ztl', 'parcheggio', 'autostrada', 'pedaggio',
    'telepass', 'noleggio',
  ],
  Benzina: [
    'benzina', 'carburante', 'diesel', 'gasolio', 'distributore',
    'eni', 'q8', 'ip', 'tamoil', 'total', 'rifornimento',
  ],
  Stipendio: [
    'stipendio', 'paga', 'salario', 'compenso', 'busta paga',
    'mensilità', 'tredicesima', 'quattordicesima', 'freelance',
    'fattura', 'parcella',
  ],
  Altro: [
    'commissione', 'commissioni', 'spedizione', 'posta',
    'poste', 'raccomandata', 'francobollo', 'pacco', 'corriere',
    'lavanderia', 'tintoria', 'sarto', 'calzolaio',
    'donazione', 'beneficenza', 'sanzione', 'bancomat',
  ],
};


/**
 * Extracts amount from natural Italian text.
 * Handles: "25", "25 euro", "€25", "25,50", "25.50", embedded in any sentence
 */
function extractAmount(text: string): { amount: number; rest: string } | null {
  // Try patterns from most specific to least
  const patterns: [RegExp, RegExp][] = [
    // "€25" or "€ 25.50"
    [/€\s*(\d+(?:[.,]\d{1,2})?)/, /€\s*\d+(?:[.,]\d{1,2})?/],
    // "25 euro" or "25€"
    [/(\d+(?:[.,]\d{1,2})?)\s*(?:€|euro|eur)\b/i, /\d+(?:[.,]\d{1,2})?\s*(?:€|euro|eur)\b/i],
    // "di 1051" or "da 25"
    [/(?:di|da)\s+(\d+(?:[.,]\d{1,2})?)(?:\s|$|[.,])/i, /(?:di|da)\s+\d+(?:[.,]\d{1,2})?/i],
    // any standalone number
    [/(\d+(?:[.,]\d{1,2})?)/, /\d+(?:[.,]\d{1,2})?/],
  ];

  for (const [extractPattern, removePattern] of patterns) {
    const match = text.match(extractPattern);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      if (amount > 0 && amount < 1000000) {
        const rest = text.replace(removePattern, ' ').replace(/\s+/g, ' ').trim();
        return { amount, rest };
      }
    }
  }

  return null;
}

/**
 * Detects income vs expense from natural language
 */
export function detectType(text: string): 'income' | 'expense' {
  const lower = text.toLowerCase();
  for (const pattern of INCOME_PATTERNS) {
    if (lower.includes(pattern)) return 'income';
  }
  return 'expense';
}

/**
 * Matches category by keywords. Longer keyword matches win (more specific).
 */
export function suggestCategory(text: string, type: 'income' | 'expense'): string | null {
  const lower = text.toLowerCase();

  // For income, always try Stipendio first
  if (type === 'income') {
    for (const kw of CATEGORY_KEYWORDS['Stipendio']) {
      if (lower.includes(kw)) return 'Stipendio';
    }
    // Generic income → still Stipendio
    return 'Stipendio';
  }

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'Stipendio') continue; // income-only
    for (const keyword of keywords) {
      if (lower.includes(keyword) && keyword.length > bestScore) {
        bestMatch = category;
        bestScore = keyword.length;
      }
    }
  }

  return bestMatch;
}

/**
 * Cleans description from filler words, keeping meaningful content
 */
function cleanDescription(rawText: string, originalText: string): string {
  // Use raw (amount-removed) text as base, fall back to original
  let desc = (rawText || originalText)
    .replace(/^(ho\s+)?(speso|pagato|preso|comprato|fatto|pago|presi|presa)\s*/i, '')
    .replace(/^(mi\s+)?(sono\s+)?(arrivat[oiae]|ricevut[oiae])\s*/i, '')
    .replace(/^(mi\s+hanno\s+)?(dat[oiae]|pagat[oiae]|accreditat[oiae])\s*/i, '')
    .replace(/^(ieri|oggi|stamattina|stasera|stanotte)\s*/i, '')
    .replace(/^\s*(per|di|da|il|la|lo|le|gli|un|una|uno|al|dal|del|nel)\s+/i, '')
    .replace(/\s+(euro|€|eur)(\s|$)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove leading prepositions again (can appear after previous removals)
  desc = desc.replace(/^\s*(per|di|da|al|dal|del|nel|il|la|lo)\s+/i, '').trim();

  if (desc.length > 0) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return desc || 'Transazione';
}

/**
 * Main parser: understands natural Italian and extracts structured financial data
 */
export function parseMessage(text: string): ParsedMessage | null {
  const extracted = extractAmount(text);
  if (!extracted) return null;

  const type = detectType(text);
  const suggestedCategory = suggestCategory(text, type);
  const description = cleanDescription(extracted.rest, text);

  return {
    amount: extracted.amount,
    description,
    type,
    suggestedCategory,
  };
}
