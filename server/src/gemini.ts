import { z } from 'zod';

const PLACEHOLDER_GEMINI_KEYS = new Set(['', 'your_gemini_api_key_here', 'your_api_key_here']);

export const isGeminiConfigured = (apiKey: string | undefined): boolean => {
  const key = apiKey?.trim();
  return Boolean(key && !PLACEHOLDER_GEMINI_KEYS.has(key));
};

export const geminiModel = (): string => process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';

const stringField = (description: string) => ({ type: 'string', description });
const stringArrayField = (description: string) => ({ type: 'array', description, items: { type: 'string' } });

/** JSON Schema objects accepted by the Gemini `responseSchema` field. */
export const geminiResponseSchemas = {
  insight: {
    type: 'object',
    properties: {
      headline: stringField('One short, encouraging headline (max 140 characters).'),
      summary: stringField('Two to four sentences summarising the personal patterns in the data (max 900 characters).'),
      observations: stringArrayField('Two to five factual observations that are directly supported by the supplied data.'),
      suggestions: stringArrayField('Two to four practical, non-medical suggestions the person could try.'),
      caution: stringField('One cautious note about limits, context and the fact this is not a diagnosis.')
    },
    required: ['headline', 'summary', 'observations', 'suggestions', 'caution']
  },
  learning: {
    type: 'object',
    properties: {
      title: stringField('Short educational title for the topic (max 120 characters).'),
      explanation: stringField('Plain-language explanation of the cognitive mechanism (max 1200 characters).'),
      processes: stringArrayField('Three to six processes or brain systems involved.'),
      evidence: stringField('A cautious evidence summary without diagnostic claims (max 900 characters).'),
      limitations: stringField('Limitations of short browser tasks and self-tracking (max 500 characters).')
    },
    required: ['title', 'explanation', 'processes', 'evidence', 'limitations']
  },
  recipe: {
    type: 'object',
    properties: {
      band: stringField('The score band these recipes are matched to.'),
      items: {
        type: 'array',
        description: 'Three to six affordable, hostel or campus friendly food ideas.',
        items: {
          type: 'object',
          properties: {
            category: stringField('Short category such as Hostel Budget, Fresh Fruit or Nutrient-Dense.'),
            title: stringField('Name of the food or snack.'),
            detail: stringField('One or two sentences describing it, with no medical claims.'),
            price: stringField('Optional rough local price.')
          },
          required: ['category', 'title', 'detail']
        }
      },
      sources: {
        type: 'array',
        description: 'Optional source titles and HTTPS URLs.',
        items: {
          type: 'object',
          properties: { title: stringField('Source title.'), url: stringField('Canonical HTTPS URL.') },
          required: ['title', 'url']
        }
      }
    },
    required: ['band', 'items']
  }
} as const;

export const insightSchema = z.object({
  headline: z.string().min(4).max(140),
  summary: z.string().min(20).max(900),
  observations: z.array(z.string().min(4).max(260)).min(2).max(5),
  suggestions: z.array(z.string().min(4).max(260)).min(2).max(4),
  caution: z.string().min(10).max(400)
});
export type Insight = z.infer<typeof insightSchema>;

export const learningSchema = z.object({
  title: z.string().min(4).max(120),
  explanation: z.string().min(20).max(1200),
  processes: z.array(z.string().min(2).max(120)).min(3).max(6),
  evidence: z.string().min(20).max(900),
  limitations: z.string().min(10).max(500)
});
export type LearningContent = z.infer<typeof learningSchema>;

export const recipeSchema = z.object({
  band: z.string().min(2).max(40),
  items: z.array(z.object({
    category: z.string().min(2).max(60),
    title: z.string().min(2).max(120),
    detail: z.string().min(10).max(400),
    price: z.string().max(20).optional()
  })).min(3).max(6),
  sources: z.array(z.object({ title: z.string().min(2).max(160), url: z.string().url().max(400) })).max(5).optional()
});
export type RecipeItem = z.infer<typeof recipeSchema>['items'][number];
export type RecipeSet = z.infer<typeof recipeSchema>;

const cleanJsonText = (text: string): string => text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

/**
 * Call the Gemini generateContent REST endpoint and validate the JSON response.
 * The API key is sent only to Google; it never leaves the server process.
 */
export async function generateGeminiJson<T>(options: {
  apiKey: string;
  prompt: string;
  responseSchema: object;
  schema: z.ZodType<T>;
  model?: string;
  timeoutMs?: number;
}): Promise<T> {
  const model = options.model ?? geminiModel();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(options.apiKey)}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(options.timeoutMs ?? 45_000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: options.prompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: 'application/json', responseSchema: options.responseSchema }
      })
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new Error(timedOut ? 'Gemini took too long to respond. Please try again.' : 'Could not reach Gemini. Check your internet connection and retry.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const body: unknown = await response.json();
      if (body && typeof body === 'object' && 'error' in body) {
        const message = (body as { error?: { message?: unknown } }).error?.message;
        if (typeof message === 'string') detail = message.slice(0, 200);
      }
    } catch {
      // Ignore an unreadable error body.
    }
    const advice = response.status === 400
      ? 'Check the GEMINI_API_KEY and GEMINI_MODEL values.'
      : response.status === 401 || response.status === 403
        ? 'Check that the GEMINI_API_KEY is valid and enabled for this model.'
        : response.status === 429
          ? 'Gemini rate limit reached. Try again later.'
          : 'Check the Gemini service and server logs.';
    throw new Error(`Gemini request failed (HTTP ${response.status}). ${advice}${detail ? ` ${detail}` : ''}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Gemini returned an unreadable response. Please retry.');
  }
  if (!payload || typeof payload !== 'object') throw new Error('Gemini returned an unexpected result format. Please retry.');
  const record = payload as { promptFeedback?: { blockReason?: unknown }; candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> };
  if (record.promptFeedback?.blockReason) throw new Error(`Gemini blocked the request (${String(record.promptFeedback.blockReason)}). Please retry.`);
  const text = (record.candidates ?? []).flatMap((candidate) => (candidate.content?.parts ?? []).map((part) => typeof part.text === 'string' ? part.text : '')).join('');
  if (!text.trim()) throw new Error('Gemini returned no content. Please retry.');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJsonText(text));
  } catch {
    throw new Error('Gemini returned malformed JSON. Please retry.');
  }
  const result = options.schema.safeParse(parsed);
  if (!result.success) throw new Error('Gemini returned an unexpected result format. Please retry.');
  return result.data;
}
