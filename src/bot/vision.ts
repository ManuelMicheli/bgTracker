import OpenAI from 'openai';
import { logger } from '@/lib/logger';

export interface ExtractedTransaction {
  amount: number;
  description: string;
  type: 'expense' | 'income';
}

const SYSTEM_PROMPT = `Sei un assistente che analizza foto di transazioni finanziarie (estratti conto, liste movimenti, scontrini, screenshot bancari).

Estrai OGNI transazione visibile nell'immagine e restituisci SOLO un JSON array valido, senza markdown o testo aggiuntivo.

Ogni elemento deve avere:
- "amount": numero positivo (es. 25.50, senza simbolo valuta)
- "description": breve descrizione della transazione (es. "Supermercato", "Benzina", "Stipendio")
- "type": "expense" per uscite/pagamenti/acquisti, "income" per entrate/accrediti/stipendi

Esempio output:
[{"amount":25.50,"description":"Supermercato Lidl","type":"expense"},{"amount":1800,"description":"Stipendio","type":"income"}]

Se non riesci a leggere l'immagine o non ci sono transazioni, restituisci un array vuoto: []`;

export async function extractTransactionsFromPhoto(
  imageBase64: string,
): Promise<ExtractedTransaction[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY non configurata');
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Analizza questa immagine ed estrai tutte le transazioni. Rispondi SOLO con il JSON array.',
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      logger.warn('OpenAI returned empty response');
      return [];
    }

    // Strip markdown code fences if present
    const jsonStr = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      logger.warn('OpenAI response is not an array', { content });
      return [];
    }

    // Validate and filter each transaction
    return parsed.filter((item): item is ExtractedTransaction => {
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
  } catch (error) {
    logger.error('Vision extraction failed', { error: String(error) });
    throw error;
  }
}
