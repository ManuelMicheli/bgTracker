import { analyzeSpending } from '@/lib/insights/analyzer';
import { generateSuggestions } from '@/lib/insights/suggestions';

export async function getInsights(userId: string, date: Date = new Date()) {
  const analysis = await analyzeSpending(userId, date);
  const suggestions = await generateSuggestions(analysis);

  return {
    analysis,
    suggestions,
  };
}
