import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://bvnkoglvpljizeogslmp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G';
const CORPUS_ENDPOINT = 'https://bvnkoglvpljizeogslmp.supabase.co/functions/v1/oracle-corpus';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c],
  );

function styles() {
  const s = document.createElement('style');
  s.textContent = `
.corpusView{position:fixed;inset:0;z-index:69;background:rgba(28,18,13,.95);display:none;overflow:auto}.corpusView.open{display:block}
.corpusCard{max-width:1180px;margin:50px auto 40px;background:#efdab2;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:28px}.corpusClose{float:right;border:0;background:none;font-size:28px;color:#6f482f}
.corpusGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.corpusRow{padding:14px 0;border-bottom:1px solid #b08b61}.corpusMeta{font-size:11px;color:#765c47}.corpusBadge{display:inline-block;border:1px solid #9a7452;padding:3px 6px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#8d342c}.corpusActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:9px}.corpusSource textarea{width:100%;min-height:220px;border:1px solid #896442;background:#f3dfb6;color:#241812;padding:10px;resize:vertical}.corpusMessage{font-size:12px;color:#6d523d;line-height:1.45}.corpusSearch{display:flex;gap:7px;margin:12px 0}.corpusSearch input{flex:1;border:1px solid #896442;background:#f3dfb6;padding:10px}.corpusResult{padding:11px 0;border-bottom:1px solid #b08b61}.corpusResult small{color:#765c47}.corpusEmpty{padding:14px 0;color:#6d523d}@media(max-width:800px){.corpusCard{margin:10px;padding:18px}.corpusGrid{grid-template-columns:1fr}}
`;
  document.head.appendChild(s);
}

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}
async function isAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

async function extractFile(user, path, format) {
  const { data, error } = await supabase.storage
    .from('oracle-private-sources')
    .createSignedUrl(path, 600);
  if (error || !data?.signedUrl) throw new Error('Could not access the private source file.');
  const response = await fetch(data.signedUrl);
  if (!response.ok) throw new Error('Could not download the private source file.');
  if (format === 'txt' || format === 'md') return { content: await response.text(), format };
  if (format === 'pdf') {
    const bytes = await response.arrayBuffer();
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const pages = [];
    const maxPages = Math.min(pdf.numPages, 300);
    for (let n = 1; n <= maxPages; n++) {
      const page = await pdf.getPage(n);
      const tc = await page.getTextContent();
      const text = tc.items
        .map((i) => i?.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) pages.push({ page: n, text });
    }
    return { pages, format: 'pdf', pageCount: pdf.numPages };
  }
  throw new Error('This build can ingest TXT, Markdown and PDF sources.');
}

async function ingest(sourceId) {
  const msg = document.getElementById('corpusMessage');
  msg.textContent = 'Preparing source…';
  try {
    const user = await currentUser();
    if (!user) throw new Error('Sign in first.');
    if (!(await isAdmin())) throw new Error('Admin access required.');
    const { data: s, error } = await supabase
      .from('source_submissions')
      .select('id,title,review_status,rights_status,storage_path')
      .eq('id', sourceId)
      .single();
    if (error || !s) throw new Error('Source record not found.');
    if (s.review_status !== 'approved') throw new Error('Approve the source before indexing it.');
    if (!['public_domain', 'licensed'].includes(s.rights_status))
      throw new Error('Only public-domain/licensed sources can enter the searchable corpus.');
    let payload = { sourceSubmissionId: s.id, format: 'text', content: '' };
    if (s.storage_path) {
      const ext = (s.storage_path.split('.').pop() || '').toLowerCase();
      const extracted = await extractFile(user, s.storage_path, ext);
      payload = { ...payload, ...extracted, sourceSubmissionId: s.id };
    } else {
      const ta = document.getElementById('corpusText');
      if (!ta.value.trim())
        throw new Error(
          'Paste source text into the ingestion box or attach a TXT/Markdown/PDF file.',
        );
      payload.content = ta.value;
      payload.format = 'text';
    }
    msg.textContent = 'Indexing approved source…';
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch(CORPUS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify(payload),
    });
    const out = await response.json();
    if (!response.ok) throw new Error(out.error || 'Corpus ingestion failed.');
    msg.textContent = `Indexed ${out.chunkCount} research passages.`;
    await load();
  } catch (e) {
    msg.textContent = e?.message || 'Ingestion failed.';
  }
}

async function load() {
  const list = document.getElementById('corpusList');
  if (!list) return;
  if (!(await isAdmin())) {
    list.innerHTML = '<div class="corpusEmpty">Admin access required.</div>';
    return;
  }
  const { data, error } = await supabase
    .from('source_submissions')
    .select('id,title,author,rights_status,review_status,storage_path')
    .eq('review_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    list.innerHTML = '<div class="corpusEmpty">Unable to load approved sources.</div>';
    return;
  }
  list.innerHTML = data?.length
    ? data
        .map(
          (s) =>
            `<article class="corpusRow"><h3>${esc(s.title)}</h3><div class="corpusMeta">${esc(s.author || 'Unknown author')} · ${esc(s.rights_status)} · <span class="corpusBadge">approved</span></div><div class="corpusActions"><button class="primary" data-ingest="${s.id}">${s.storage_path ? 'Extract & index file' : 'Index supplied text'}</button></div></article>`,
        )
        .join('')
    : '<div class="corpusEmpty">No approved sources are ready for ingestion.</div>';
  list
    .querySelectorAll('[data-ingest]')
    .forEach((b) => (b.onclick = () => ingest(b.dataset.ingest)));
}

async function search() {
  const q = document.getElementById('corpusQuery').value.trim(),
    out = document.getElementById('corpusResults');
  if (!q) {
    out.innerHTML = '';
    return;
  }
  const { data, error } = await supabase.rpc('search_corpus', { p_query: q, p_limit: 10 });
  if (error) {
    out.innerHTML = `<div class="corpusEmpty">${esc(error.message)}</div>`;
    return;
  }
  out.innerHTML = data?.length
    ? data
        .map(
          (r) =>
            `<article class="corpusResult"><strong>${esc(r.title)}</strong><div><small>Pages ${r.page_start || '—'}–${r.page_end || '—'} · relevance ${Number(r.rank || 0).toFixed(3)}</small></div><p>${esc(r.content)}</p></article>`,
        )
        .join('')
    : '<div class="corpusEmpty">No indexed passage matched that query.</div>';
}

function build() {
  styles();
  const rail = document.querySelector('.rail');
  if (!rail) return;
  const nav = document.createElement('button');
  nav.type = 'button';
  nav.textContent = 'Corpus';
  nav.dataset.corpusNav = '1';
  nav.hidden = true;
  rail.appendChild(nav);
  const view = document.createElement('section');
  view.id = 'oracleCorpus';
  view.className = 'corpusView';
  view.innerHTML = `<div class="corpusCard"><button class="corpusClose" id="corpusClose">×</button><div class="kicker">Research corpus</div><h2>Corpus ingestion</h2><p class="corpusMessage">Only approved public-domain/licensed sources enter the searchable corpus. Restricted or unknown-rights material remains outside indexed content.</p><div class="corpusGrid"><div><div class="kicker">Approved sources</div><div id="corpusList"></div><div class="field"><label>Manual text ingestion</label><textarea id="corpusText" placeholder="Paste extracted text here when no source file is attached…"></textarea></div></div><div><div class="kicker">Search indexed passages</div><div class="corpusSearch"><input id="corpusQuery" placeholder="e.g. dhāraṇā, kula, śakti…"><button class="primary" id="corpusSearchBtn">Search</button></div><div id="corpusResults"></div></div></div><div id="corpusMessage" class="corpusMessage" style="margin-top:15px"></div></div>`;
  document.body.appendChild(view);
  nav.onclick = () => {
    view.classList.add('open');
    load();
  };
  document.getElementById('corpusClose').onclick = () => view.classList.remove('open');
  document.getElementById('corpusSearchBtn').onclick = search;
  document.getElementById('corpusQuery').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') search();
  });
  async function refresh() {
    nav.hidden = !(await isAdmin());
  }
  supabase.auth.onAuthStateChange(refresh);
  refresh();
}
addEventListener('DOMContentLoaded', build, { once: true });
