import { analyzeSpending } from '@/lib/insights/analyzer';
import { generateSuggestions } from '@/lib/insights/suggestions';

export async function getInsights(date: Date = new Date()) {
  const analysis = await analyzeSpending(date);
  const suggestions = await generateSuggestions(analysis);

  return {
    analysis,
    suggestions,
  };
}
