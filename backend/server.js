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
const frontendOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${port}`;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: frontendOrigin, methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '64kb' }));

const chatLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' } });

const chatSchema = z.object({
  language: z.enum(['en', 'bn', 'hi', 'sa', 'zh', 'es']).default('en'),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(12000) })).max(20)
});

const systemPrompt = `You are the Oracle of Tantra, a scholarly research assistant focused on Tantra and related esoteric traditions.

Scope: Indian Tantra (Shaiva, Shakta, Vaishnava, Vamachara, Dakshinachara, Kaula, Sri Vidya, Aghora); Buddhist Tantra/Vajrayana; Daoist internal alchemy and East Asian esotericism when historically relevant; and African-diasporic/Brazilian traditions only when relevant.

Every substantial answer should distinguish, where evidence allows:
- Textual evidence
- Historical scholarship
- Traditional interpretation
- Modern interpretation
- AI synthesis

Rules:
1. Be scholarly, respectful, precise and non-sensational.
2. Never invent scriptures, quotations, lineages, dates, practices or citations. If uncertain, say so.
3. Do not present spiritual claims as scientifically proven facts.
4. Explain that practices vary by lineage, region, initiation and historical period.
5. For potentially dangerous practices, give historical/contextual information without encouraging unsafe physical acts.
6. When naming a text, author, school or concept, provide enough context to distinguish it from similarly named traditions.
7. Answer in the requested language and preserve Sanskrit/Bengali technical terms where useful.
8. If sources are not available to the system, say that you cannot verify them instead of fabricating citations.

The requested language codes are: en=English, bn=Bengali, hi=Hindi, sa=Sanskrit, zh=Mandarin Chinese, es=Spanish.`;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const languageNames = { en: 'English', bn: 'scholarly Bengali', hi: 'scholarly Hindi', sa: 'Sanskrit', zh: 'Mandarin Chinese', es: 'Spanish' };

async function askOpenAI(messages, language) {
  const languageInstruction = `Respond entirely in ${languageNames[language] || 'English'}.`;
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
    temperature: 0.35,
    messages: [{ role: 'system', content: `${systemPrompt}\n\n${languageInstruction}` }, ...messages]
  });
  return response.choices?.[0]?.message?.content?.trim() || 'I could not produce a response.';
}

async function askPollinations(messages, language) {
  const languageInstruction = `[MANDATORY: Answer entirely in ${languageNames[language] || 'English'}.]`;
  const response = await fetch(process.env.POLLINATIONS_URL || 'https://text.pollinations.ai/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.POLLINATIONS_MODEL || 'openai', messages: [{ role: 'system', content: systemPrompt }, ...messages, { role: 'user', content: languageInstruction }] })
  });
  if (!response.ok) throw new Error(`Fallback provider returned ${response.status}`);
  return (await response.text()).trim();
}

app.get('/api/health', (_req, res) => res.json({ ok: true, provider: openai ? 'openai' : 'pollinations' }));

app.post('/api/chat', chatLimiter, async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request. Messages must be short, valid chat messages.' });
  try {
    const { language, messages } = parsed.data;
    const reply = openai ? await askOpenAI(messages, language) : await askPollinations(messages, language);
    return res.json({ reply, provider: openai ? 'openai' : 'pollinations' });
  } catch (error) {
    console.error('Chat provider error:', error);
    return res.status(502).json({ error: 'The Oracle could not reach its language service. Please try again.' });
  }
});

app.use(express.static(path.resolve(__dirname, '..')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.resolve(__dirname, '..', 'index.html'));
});

app.listen(port, () => console.log(`Oracle backend listening on http://localhost:${port}`));
