/**
 * Parser per linguaggio naturale italiano.
 * Estrae importo, descrizione, tipo (spesa/entrata) e suggerisce una categoria
 * da messaggi scritti in modo colloquiale.
 *
 * Esempi:
 *   "Ho speso 25 euro per la pizza con gli amici"
 *   "Pagato 85.50 di spesa al supermercato"
 *   "Mi sono arrivati 1800 euro di stipendio"
 *   "Netflix 12.99"
 *   "Ieri benzina 45 euro"
 *   "Preso un caffè 1.50"
 *   "Bolletta luce 62 euro"
 *   "Ricevuto bonifico 500 euro"
 */

export interface ParsedMessage {
  amount: number;
  description: string;
  type: 'expense' | 'income';
  suggestedCategory: string | null;
}

// Keywords that indicate income
const INCOME_KEYWORDS = [
  'stipendio', 'ricevuto', 'arrivat', 'entrata', 'guadagnat', 'bonifico',
  'accredito', 'rimborso', 'incassat', 'paga', 'compenso', 'premio',
];

// Category keyword mapping (category name -> keywords)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Spesa': [
    'spesa', 'supermercato', 'supermarket', 'alimentari', 'esselunga', 'conad',
    'lidl', 'carrefour', 'coop', 'eurospin', 'md', 'penny', 'aldi', 'pam',
    'despar', 'tigre', 'simply',
  ],
  'Trasporti': [
    'benzina', 'carburante', 'diesel', 'treno', 'biglietto', 'metro', 'bus',
    'autobus', 'taxi', 'uber', 'bolt', 'parcheggio', 'autostrada', 'pedaggio',
    'bollo', 'assicurazione auto', 'meccanico', 'gomme', 'tagliando',
    'revisione', 'gasolio',
  ],
  'Abbonamenti': [
    'netflix', 'spotify', 'disney', 'prime', 'amazon prime', 'dazn', 'sky',
    'youtube', 'abbonamento', 'hbo', 'apple music', 'playstation', 'xbox',
    'gamepass', 'crunchyroll', 'tim', 'vodafone', 'windtre', 'iliad',
    'fastweb', 'fibra', 'internet', 'palestra', 'gym',
  ],
  'Ristoranti': [
    'pizza', 'pizzeria', 'ristorante', 'cena', 'pranzo', 'sushi',
    'hamburger', 'mcdonalds', 'burger', 'kebab', 'bar', 'caffè', 'caffe',
    'aperitivo', 'apericena', 'colazione', 'brunch', 'pub', 'trattoria',
    'osteria', 'paninoteca', 'gelateria', 'gelato', 'deliveroo', 'glovo',
    'justeat', 'uber eats',
  ],
  'Salute': [
    'farmacia', 'medicina', 'medicinale', 'dottore', 'medico', 'visita',
    'dentista', 'oculista', 'psicologo', 'terapia', 'esame', 'analisi',
    'ospedale', 'ricetta', 'integratore', 'vitamina',
  ],
  'Casa': [
    'affitto', 'bolletta', 'luce', 'gas', 'acqua', 'condominio', 'ikea',
    'mobili', 'elettrodomestico', 'riparazione', 'idraulico', 'elettricista',
    'pulizie', 'detersivo', 'tari', 'spazzatura', 'rifiuti', 'mutuo',
  ],
  'Intrattenimento': [
    'cinema', 'film', 'concerto', 'teatro', 'museo', 'mostra', 'evento',
    'biglietto', 'videogioco', 'gioco', 'steam', 'playstation', 'libro',
    'fumetto', 'manga', 'hobby', 'sport', 'partita', 'stadio',
  ],
  'Stipendio': [
    'stipendio', 'paga', 'salario', 'compenso', 'bonifico', 'busta paga',
  ],
};

/**
 * Extracts amount from a natural language Italian message.
 * Handles formats like: "25", "25 euro", "€25", "25,50", "25.50"
 */
function extractAmount(text: string): { amount: number; rest: string } | null {
  const normalized = text.toLowerCase();

  // Patterns in priority order
  const patterns = [
    // "€25" or "€ 25" or "€25,50"
    /€\s*(\d+(?:[.,]\d{1,2})?)/,
    // "25 euro" or "25€" or "25,50 euro"
    /(\d+(?:[.,]\d{1,2})?)\s*(?:€|euro|eur)/,
    // "di 25" or "da 25"
    /(?:di|da|per)\s+(\d+(?:[.,]\d{1,2})?)/,
    // standalone number (at least 1 digit)
    /(\d+(?:[.,]\d{1,2})?)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      if (amount > 0 && amount < 100000) {
        // Remove the matched amount portion from text to get description
        const rest = text
          .replace(/€\s*\d+(?:[.,]\d{1,2})?/, '')
          .replace(/\d+(?:[.,]\d{1,2})?\s*(?:€|euro|eur)\b/i, '')
          .replace(/\d+(?:[.,]\d{1,2})?/, '')
          .trim();
        return { amount, rest };
      }
    }
  }

  return null;
}

/**
 * Determines if the message describes income or expense
 */
function detectType(text: string): 'income' | 'expense' {
  const lower = text.toLowerCase();
  for (const keyword of INCOME_KEYWORDS) {
    if (lower.includes(keyword)) return 'income';
  }
  return 'expense';
}

/**
 * Suggests a category based on keywords in the message
 */
function suggestCategory(text: string): string | null {
  const lower = text.toLowerCase();

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
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
 * Cleans up the description extracted from natural language
 */
function cleanDescription(text: string): string {
  let desc = text
    // Remove common filler words at the start
    .replace(/^(ho\s+)?(speso|pagato|preso|comprato|fatto|pago|presi)\s+/i, '')
    .replace(/^(mi\s+)?(sono\s+)?(arrivat[oiae]|ricevut[oiae])\s+/i, '')
    .replace(/^(per|di|da|il|la|lo|le|gli|un|una|uno)\s+/i, '')
    // Remove trailing filler
    .replace(/\s+(euro|€|eur)$/i, '')
    .trim();

  // Capitalize first letter
  if (desc.length > 0) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return desc || 'Transazione';
}

/**
 * Main parser: takes a natural language message and extracts structured data
 */
export function parseMessage(text: string): ParsedMessage | null {
  const extracted = extractAmount(text);
  if (!extracted) return null;

  const type = detectType(text);
  const suggestedCategory = suggestCategory(text);
  const description = cleanDescription(extracted.rest || text);

  return {
    amount: extracted.amount,
    description,
    type,
    suggestedCategory,
  };
}
