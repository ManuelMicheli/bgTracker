import OpenAI from 'openai';
import Papa from 'papaparse';
import { logger } from '@/lib/logger';
import type { ExtractedTransaction } from './vision';

const EXTRACTION_PROMPT = `Sei un assistente che analizza dati di transazioni finanziarie.

Ti verrà fornito il contenuto testuale di un file (CSV, PDF o Excel) con transazioni bancarie o finanziarie.

Estrai OGNI transazione e restituisci SOLO un JSON array valido, senza markdown o testo aggiuntivo.

Ogni elemento deve avere:
- "amount": numero positivo (es. 25.50, senza simbolo valuta)
- "description": breve descrizione della transazione
- "type": "expense" per uscite/pagamenti/addebiti/negativi, "income" per entrate/accrediti/positivi

Interpreta i segni: importi negativi o con segno "-" sono expense, positivi o con "+" sono income.
Se un importo non ha segno, deducilo dal contesto (es. "pagamento" = expense, "accredito" = income).

Esempio output:
[{"amount":25.50,"description":"Supermercato Lidl","type":"expense"},{"amount":1800,"description":"Stipendio","type":"income"}]

Se non ci sono transazioni, restituisci: []`;

// Max chars per chunk sent to AI — keeps well within token limits
const CHUNK_SIZE = 12000;

async function extractWithAI(textContent: string): Promise<ExtractedTransaction[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY non configurata');

  const openai = new OpenAI({ apiKey });

  // Split into chunks so we never lose rows from large files
  const chunks = splitIntoChunks(textContent, CHUNK_SIZE);
  logger.info('File parser: processing chunks', { totalChunks: chunks.length, totalChars: textContent.length });

  const allTransactions: ExtractedTransaction[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    logger.info(`Processing chunk ${i + 1}/${chunks.length}`, { chunkChars: chunk.length });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          {
            role: 'user',
            content:
              chunks.length > 1
                ? `Ecco il contenuto del file (parte ${i + 1} di ${chunks.length}):\n\n${chunk}\n\nEstrai tutte le transazioni come JSON array.`
                : `Ecco il contenuto del file:\n\n${chunk}\n\nEstrai tutte le transazioni come JSON array.`,
          },
        ],
        max_tokens: 16000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) continue;

      const jsonStr = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) continue;

      const valid = parsed.filter((item): item is ExtractedTransaction => {
        return (
          typeof item === 'object' &&
          item !== null &&
          typeof item.amount === 'number' &&
          item.amount > 0 &&
          typeof item.description === 'string' &&
          item.description.length > 0 &&
          (item.type === 'expense' || item.type === 'income')
        );
      });

      allTransactions.push(...valid);
    } catch (chunkError) {
      logger.error(`Chunk ${i + 1} parsing failed`, { error: String(chunkError) });
      // Continue with next chunk instead of failing entirely
    }
  }

  logger.info('File parser: extraction complete', { totalExtracted: allTransactions.length });
  return allTransactions;
}

/**
 * Splits text into chunks, trying to break at newlines to avoid cutting rows in half.
 */
function splitIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChars;

    if (end >= text.length) {
      chunks.push(text.slice(start));
      break;
    }

    // Try to break at a newline to avoid splitting a row mid-way
    const lastNewline = text.lastIndexOf('\n', end);
    if (lastNewline > start) {
      end = lastNewline + 1;
    }

    chunks.push(text.slice(start, end));
    start = end;
  }

  return chunks;
}

function parseCsvToText(buffer: Buffer): string {
  const text = buffer.toString('utf-8');
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.data.length === 0) return text;

  // Convert parsed CSV back to readable text for AI
  return result.data
    .map((row) => {
      const values = Object.entries(row as Record<string, string>)
        .map(([key, val]) => `${key}: ${val}`)
        .join(' | ');
      return values;
    })
    .join('\n');
}

async function parsePdfToText(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  return result.text ?? '';
}

async function parseExcelToText(buffer: Buffer): Promise<string> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const lines: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    for (const row of rows) {
      const values = Object.entries(row)
        .map(([key, val]) => `${key}: ${val}`)
        .join(' | ');
      lines.push(values);
    }
  }

  return lines.join('\n');
}

export async function extractTransactionsFromFile(
  buffer: Buffer,
  fileName: string,
): Promise<ExtractedTransaction[]> {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  let textContent: string;

  try {
    switch (ext) {
      case 'csv':
        textContent = parseCsvToText(buffer);
        break;
      case 'pdf':
        textContent = await parsePdfToText(buffer);
        break;
      case 'xlsx':
      case 'xls':
        textContent = await parseExcelToText(buffer);
        break;
      default:
        // Try as plain text
        textContent = buffer.toString('utf-8');
        break;
    }
  } catch (error) {
    logger.error('File parsing failed', { fileName, ext, error: String(error) });
    throw new Error(`Impossibile leggere il file ${ext.toUpperCase()}`);
  }

  if (!textContent.trim()) {
    return [];
  }

  return extractWithAI(textContent);
}

export const SUPPORTED_EXTENSIONS = ['csv', 'pdf', 'xlsx', 'xls'];
