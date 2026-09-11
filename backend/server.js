import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const configuredOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${port}`;
const allowedOrigins = configuredOrigin
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
);
app.use(express.json({ limit: '96kb' }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});
const chatSchema = z.object({
  language: z.enum(['en', 'bn', 'hi', 'sa', 'zh', 'es']).default('en'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(12000),
      }),
    )
    .min(1)
    .max(20),
});

const systemPrompt = `You are The Oracle of Tantra, a careful scholarly research assistant focused on Tantra and related esoteric traditions.

Scope includes Indian Tantra (Shaiva, Shakta, Vaishnava, Vamachara, Dakshinachara, Kaula, Sri Vidya, Aghora), Buddhist Tantra/Vajrayana, Daoist internal alchemy and East Asian esotericism when historically relevant, and African-diasporic/Brazilian traditions only when relevant.

For substantial research answers, organize the response into these distinct layers whenever applicable:
1. Textual evidence — what primary texts actually say; quote only when verified from supplied or known reliable text.
2. Historical scholarship — dating, transmission, academic interpretations and disagreements.
3. Traditional interpretation — lineage or commentarial readings, explicitly attributed and never presented as universal.
4. Modern interpretation — contemporary academic, popular or psychological readings, clearly distinguished from premodern sources.
5. AI synthesis — your reasoned comparison of the above, with uncertainty stated.

Rules: be scholarly, respectful, precise and non-sensational. Never invent scriptures, quotations, lineages, dates, practices, page numbers or citations. If you cannot verify a claim, say so. Never present spiritual or supernatural claims as scientifically proven facts. Explain when practices vary by lineage, region, initiation and historical period. For potentially dangerous practices, provide historical/contextual information without encouraging unsafe physical acts. Preserve Sanskrit/Bengali technical terms when useful. If a source is unavailable, do not pretend to have read it. When a user asks for exact textual evidence, request or rely on the actual edition/source rather than hallucinating a passage.

Language codes: en=English, bn=scholarly Bengali, hi=scholarly Hindi, sa=Sanskrit, zh=Mandarin Chinese, es=Spanish.`;
const languageNames = {
  en: 'English',
  bn: 'scholarly Bengali',
  hi: 'scholarly Hindi',
  sa: 'Sanskrit',
  zh: 'Mandarin Chinese',
  es: 'Spanish',
};
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000, maxRetries: 2 })
  : null;

async function askOpenAI(messages, language) {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    temperature: 0.25,
    messages: [
      {
        role: 'system',
        content: `${systemPrompt}\n\nRespond entirely in ${languageNames[language] || 'English'}, while preserving original Sanskrit names where useful.`,
      },
      ...messages,
    ],
  });
  return response.choices?.[0]?.message?.content?.trim() || 'I could not produce a response.';
}

async function askPollinations(messages, language) {
  const response = await fetch(process.env.POLLINATIONS_URL || 'https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.POLLINATIONS_MODEL || 'openai',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: `Respond entirely in ${languageNames[language] || 'English'}.` },
      ],
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`Fallback provider returned ${response.status}`);
  return (await response.text()).trim();
}

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, provider: openai ? 'openai' : 'pollinations', version: '1.1' }),
);
app.post('/api/chat', chatLimiter, async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: 'Invalid request. Send at least one valid chat message.' });
  try {
    const { language, messages } = parsed.data;
    const reply = openai
      ? await askOpenAI(messages, language)
      : await askPollinations(messages, language);
    return res.json({ reply, provider: openai ? 'openai' : 'pollinations' });
  } catch (error) {
    console.error('Chat provider error:', error?.message || error);
    return res
      .status(502)
      .json({ error: 'The Oracle could not reach its language service. Please try again.' });
  }
});

app.use(express.static(path.resolve(__dirname, '..'), { extensions: ['html'] }));
app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.resolve(__dirname, '..', 'index.html')));

app.listen(port, () => console.log(`Oracle backend listening on http://localhost:${port}`));
