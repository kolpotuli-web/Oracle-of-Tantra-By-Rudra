import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://bvnkoglvpljizeogslmp.supabase.co',
  'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G',
);
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c],
  );

function ensureStyles() {
  if (document.getElementById('oracleCitationStyles')) return;
  const s = document.createElement('style');
  s.id = 'oracleCitationStyles';
  s.textContent = `
    .citationRef{display:inline-flex;align-items:center;gap:5px;border:1px solid #9a7452;background:#ead3a8;color:#6f3128;padding:2px 7px;margin:2px 3px;border-radius:12px;font:inherit;font-size:11px;cursor:pointer;vertical-align:baseline}.citationRef:hover{background:#dcc18d}.citationShelf{margin-top:10px;padding-top:10px;border-top:1px solid #b08b61;display:flex;gap:6px;flex-wrap:wrap}.citationShelfLabel{width:100%;font-size:10px;text-transform:uppercase;letter-spacing:.13em;color:#8d342c}.citationDrawer{position:fixed;z-index:145;top:0;right:0;bottom:0;width:min(620px,94vw);background:#f0d9ad;border-left:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);transform:translateX(110%);transition:transform .25s ease;overflow:auto}.citationDrawer.open{transform:none}.citationDrawerInner{padding:28px 28px 60px}.citationClose{float:right;border:0;background:none;font-size:28px;color:#6f482f}.citationKicker{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#8d342c}.citationDrawer h2{font-weight:normal;font-size:28px;margin:8px 0}.citationMeta{font-size:12px;color:#6d523d;line-height:1.55}.citationExcerpt{margin:18px 0;padding:14px 16px;border-left:3px solid #8d342c;background:#ead3a8;line-height:1.65;white-space:pre-wrap}.citationActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.citationBtn{border:1px solid #765039;background:transparent;color:#241812;padding:9px 13px}.citationPrimary{background:#71342b;color:#f5dfb5}.citationNotice{font-size:11px;color:#6d523d;margin-top:12px}@media(max-width:600px){.citationDrawerInner{padding:20px 18px 50px}.citationDrawer{width:96vw}}
  `;
  document.head.appendChild(s);
}

function ensureDrawer() {
  if (document.getElementById('citationDrawer')) return;
  const d = document.createElement('aside');
  d.id = 'citationDrawer';
  d.className = 'citationDrawer';
  d.innerHTML = `<div class="citationDrawerInner"><button class="citationClose" id="citationClose">×</button><div class="citationKicker">Source reference</div><div id="citationBody"><p>Choose a citation to inspect its source record.</p></div></div>`;
  document.body.appendChild(d);
  document.getElementById('citationClose').onclick = () => d.classList.remove('open');
}

async function getCitation(id) {
  const { data, error } = await supabase.rpc('get_citation_record', { p_citation_id: id });
  if (error) throw error;
  return data?.[0] || null;
}

async function openCitation(id) {
  ensureDrawer();
  const body = document.getElementById('citationBody'),
    d = document.getElementById('citationDrawer');
  d.classList.add('open');
  body.innerHTML = '<p>Loading source record…</p>';
  try {
    const c = await getCitation(id);
    if (!c) {
      body.innerHTML = '<p>That citation is unavailable in this researcher workspace.</p>';
      return;
    }
    const pages =
      c.page_start || c.page_end ? ` · pages ${c.page_start ?? '—'}–${c.page_end ?? '—'}` : '';
    body.innerHTML = `<div class="citationKicker">${esc(c.source_type || 'source')}</div><h2>${esc(c.source_title || c.citation_label)}</h2><div class="citationMeta">${esc(c.source_author || 'Author/editor not recorded')}${pages}<br>Rights: ${esc(c.rights_status || 'unknown')} · Review: ${esc(c.review_status || 'unknown')}</div>${c.excerpt ? `<div class="citationExcerpt">${esc(c.excerpt)}</div>` : '<p class="citationNotice">No excerpt was stored with this citation.</p>'}<div class="citationActions">${c.source_url ? `<a class="citationBtn citationPrimary" href="${esc(c.source_url)}" target="_blank" rel="noopener">Open source ↗</a>` : ''}<button class="citationBtn" id="citationClose2">Close</button></div><p class="citationNotice">This record is a source reference, not proof by itself. Verify the cited edition/page when making scholarly claims.</p>`;
    document.getElementById('citationClose2').onclick = () => d.classList.remove('open');
  } catch (e) {
    body.innerHTML = `<p>Unable to load this source record.</p><p class="citationNotice">${esc(e.message)}</p>`;
  }
}

function renderCitations(container) {
  if (!container) return;
  const source = container.textContent || '';
  const pattern = /\[\[cite:([0-9a-fA-F-]{36})\]\]/g;
  if (!pattern.test(source)) return;
  const html = esc(source).replace(
    pattern,
    (_, id) => `<button type="button" class="citationRef" data-citation="${id}">source</button>`,
  );
  container.innerHTML = html.replace(/\n/g, '<br>');
  const ids = [...container.querySelectorAll('[data-citation]')].map((x) => x.dataset.citation);
  if (ids.length) {
    const shelf = document.createElement('div');
    shelf.className = 'citationShelf';
    shelf.innerHTML =
      '<div class="citationShelfLabel">Sources referenced in this answer</div>' +
      [...new Set(ids)]
        .map(
          (id) =>
            `<button type="button" class="citationRef" data-citation="${id}">${esc(id.slice(0, 8))}</button>`,
        )
        .join('');
    container.appendChild(shelf);
  }
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-citation]');
  if (b) openCitation(b.dataset.citation);
});
window.oracleCitations = { openCitation, renderCitations };
ensureStyles();
ensureDrawer();
