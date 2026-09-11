import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${port}`;

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: frontendOrigin, methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '64kb' }));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment and try again.' }
});

const chatSchema = z.object({
  language: z.enum(['en', 'bn']).default('en'),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(12000)
  })).max(20)
});

const systemPrompt = `You are the Oracle of Tantra, a scholarly research assistant focused on Tantra and related esoteric traditions.

Scope:
- Indian Tantra: Shaiva, Shakta, Vaishnava, Vamachara, Dakshinachara, Kaula, Sri Vidya and Aghora.
- Buddhist Tantra/Vajrayana and related Himalayan traditions.
- Daoist internal alchemy and East Asian esotericism where historically relevant.
- African-diasporic and Brazilian traditions only when the question genuinely concerns them or historical comparison is requested.

Rules:
1. Be scholarly, respectful, precise and non-sensational.
2. Separate primary-source evidence, later commentary, modern scholarship and your own synthesis.
3. Never invent scriptures, quotations, lineages, dates, practices or citations. If uncertain, say so.
4. Do not present spiritual claims as scientifically proven facts.
5. Explain that practices can vary substantially by lineage, region, initiation and historical period.
6. For potentially dangerous practices, give historical/contextual information without encouraging unsafe physical acts.
7. When naming a text, author, school or concept, provide enough context to distinguish it from similarly named traditions.
8. Answer in the requested language. Preserve Sanskrit/Bengali transliterations and technical terms where useful.

The user-selected language is supplied separately by the server.`;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function askOpenAI(messages, language) {
  const languageInstruction = language === 'bn'
    ? 'Respond entirely in scholarly Bengali. Sanskrit and technical terms may remain in their standard transliteration with Bengali explanation.'
    : 'Respond entirely in English.';

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.6-mini',
    temperature: 0.35,
    messages: [
      { role: 'system', content: `${systemPrompt}\n\n${languageInstruction}` },
      ...messages.map((m) => ({ role: m.role, content: m.content }))
    ]
  });

  return response.choices?.[0]?.message?.content?.trim() || 'I could not produce a response.';
}

async function askPollinations(messages, language) {
  const languageInstruction = language === 'bn'
    ? '[MANDATORY: Answer entirely in scholarly Bengali.]'
    : '[MANDATORY: Answer entirely in English.]';

  const response = await fetch(process.env.POLLINATIONS_URL || 'https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.POLLINATIONS_MODEL || 'openai',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: languageInstruction }
      ]
    })
  });

  if (!response.ok) throw new Error(`Fallback provider returned ${response.status}`);
  return (await response.text()).trim();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, provider: openai ? 'openai' : 'pollinations' });
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request. Messages must be short, valid chat messages.' });
  }

  try {
    const { language, messages } = parsed.data;
    const reply = openai
      ? await askOpenAI(messages, language)
      : await askPollinations(messages, language);

    return res.json({ reply, provider: openai ? 'openai' : 'pollinations' });
  } catch (error) {
    console.error('Chat provider error:', error);
    return res.status(502).json({ error: 'The Oracle could not reach its language service. Please try again.' });
  }
});

app.listen(port, () => {
  console.log(`Oracle backend listening on http://localhost:${port}`);
});
