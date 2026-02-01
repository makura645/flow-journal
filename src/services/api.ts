import type { AISummaryResult } from '../types';
import { API_ENDPOINTS } from '../constants';

export async function generateSummary(text: string): Promise<AISummaryResult> {
  const response = await fetch(API_ENDPOINTS.SUMMARY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Server error: ${response.status}`);
  }

  return response.json();
}
