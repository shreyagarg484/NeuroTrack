import { z } from 'zod';

export const isTinyFishConfigured = (apiKey: string | undefined): boolean => {
  const key = apiKey?.trim();
  return Boolean(key && key !== 'your_tinyfish_api_key_here');
};

export const outputSchema = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    explanation: { type: 'string' },
    processes: { type: 'array', items: { type: 'string' } },
    evidence: { type: 'string' },
    sources: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, url: { type: 'string' } }, required: ['title', 'url'] } },
    limitations: { type: 'string' }
  },
  required: ['topic', 'explanation', 'processes', 'evidence', 'sources', 'limitations']
};

const resultValidator = z.object({
  topic: z.string().min(2).max(120),
  explanation: z.string().min(10).max(1200),
  processes: z.array(z.string().min(2).max(100)).max(8),
  evidence: z.string().min(10).max(1500),
  sources: z.array(z.object({ title: z.string().min(2).max(180), url: z.string().url().max(500) })).max(8),
  limitations: z.string().min(10).max(1000)
});

const trustedDomain = (hostname: string) => hostname === 'doi.org' || hostname === 'nih.gov' || hostname.endsWith('.nih.gov') || hostname.endsWith('.edu') || ['nature.com', 'annualreviews.org', 'sciencedirect.com', 'frontiersin.org', 'sciencemag.org', 'apa.org'].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

export type Research = z.infer<typeof resultValidator>;
export type TinyFishResult =
  | { ok: true; research: Research }
  | { ok: false; reason: 'failed' | 'malformed' | 'empty' };

export function validateTinyFishPayload(value: unknown): TinyFishResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, reason: 'malformed' };
  const payload = value as { status?: unknown; result?: unknown };
  if (payload.status !== 'COMPLETED') return { ok: false, reason: payload.status === 'FAILED' ? 'failed' : 'malformed' };
  const parsed = resultValidator.safeParse(payload.result);
  if (!parsed.success) return { ok: false, reason: 'malformed' };
  const sources = parsed.data.sources.filter((source) => {
    try {
      const url = new URL(source.url);
      return url.protocol === 'https:' && trustedDomain(url.hostname.toLowerCase());
    } catch {
      return false;
    }
  });
  if (!sources.length) return { ok: false, reason: 'empty' };
  return { ok: true, research: { ...parsed.data, sources } };
}
