import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://bvnkoglvpljizeogslmp.supabase.co',
  'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G',
);

function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `.sourceView{position:fixed;inset:0;z-index:60;background:rgba(28,18,13,.9);display:none;overflow:auto}.sourceView.open{display:block}.sourceCard{max-width:1120px;margin:70px auto 40px;background:#efdab2;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:28px}.sourceGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.sourceList{margin-top:20px;border-top:1px solid #a27c55}.sourceRow{padding:13px 0;border-bottom:1px solid #b08b61}.sourceRow h3{margin:0;font-weight:normal}.sourceRow p{margin:5px 0;color:#5d4737}.sourceStatus{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#8d342c}.sourceForm select,.sourceForm input,.sourceForm textarea{width:100%;border:1px solid #896442;background:#f3dfb6;color:#241812;padding:10px}.sourceForm textarea{min-height:90px;resize:vertical}.sourceClose{float:right;border:0;background:none;font-size:28px;color:#6f482f}.sourceHint{font-size:12px;color:#6d523d;line-height:1.5}@media(max-width:700px){.sourceCard{margin:10px;padding:18px}.sourceGrid{grid-template-columns:1fr}}`;
  document.head.appendChild(s);
}
function addNav() {
  const rail = document.querySelector('.rail');
  if (!rail || rail.querySelector('[data-source-nav]')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = 'Sources';
  b.dataset.sourceNav = '1';
  rail.appendChild(b);
  b.addEventListener('click', openView);
}
function openView() {
  document.getElementById('oracleSources')?.classList.add('open');
  loadSources();
}
function closeView() {
  document.getElementById('oracleSources')?.classList.remove('open');
}
function build() {
  injectStyles();
  addNav();
  const v = document.createElement('section');
  v.id = 'oracleSources';
  v.className = 'sourceView';
  v.innerHTML = `<div class="sourceCard"><button class="sourceClose" id="sourceClose">×</button><div class="kicker">Source registry</div><h2>Sources & evidence</h2><p class="sourceHint">Submit a book, edition, manuscript, article or lawful web source for review. Private files stay in your account storage and are not public corpus material by default; rights status remains explicit.</p><div class="sourceGrid"><form class="sourceForm" id="sourceForm"><div class="field"><label>Title</label><input required id="sourceTitle" placeholder="e.g. Vijñāna Bhairava Tantra"></div><div class="field"><label>Author / editor</label><input id="sourceAuthor" placeholder="Author, translator or editor"></div><div class="field"><label>Source type</label><select id="sourceType"><option>primary</option><option>secondary</option><option>translation</option><option>manuscript</option><option>edition</option><option>web</option><option>other</option></select></div><div class="field"><label>Public / lawful URL</label><input id="sourceUrl" type="url" placeholder="https://…"></div><div class="field"><label>Private source file</label><input id="sourceFile" type="file" accept=".pdf,.txt,.md,.epub,.doc,.docx,.png,.jpg,.jpeg"></div><div class="field"><label>Rights status</label><select id="sourceRights"><option value="unknown">unknown</option><option value="public_domain">public domain</option><option value="licensed">licensed</option><option value="restricted">restricted</option></select></div><div class="field"><label>Research note</label><textarea id="sourceNotes" placeholder="Why is this source useful? Edition details, provenance, translation notes…"></textarea></div><button class="primary" type="submit">Submit for review</button><span id="sourceMessage" class="sourceHint"></span></form><div><div class="kicker">Your submissions</div><div id="sourceList" class="sourceList"><div class="sourceHint">Sign in to sync submissions across devices.</div></div></div></div></div>`;
  document.body.appendChild(v);
  document.getElementById('sourceClose').onclick = closeView;
  document.getElementById('sourceForm').onsubmit = submit;
}

async function uploadPrivateFile(user, file, messageEl) {
  if (!file) return null;
  const maxBytes = 25 * 1024 * 1024;
  if (file.size > maxBytes) {
    messageEl.textContent = 'Private files are limited to 25 MB in this free build.';
    return '__ERROR__';
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage
    .from('oracle-private-sources')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) {
    messageEl.textContent = 'File upload failed: ' + error.message;
    return '__ERROR__';
  }
  return path;
}

async function submit(e) {
  e.preventDefault();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const m = document.getElementById('sourceMessage');
  if (!user) {
    m.textContent = 'Sign in from Profile before submitting a source.';
    return;
  }
  const file = document.getElementById('sourceFile').files?.[0] || null;
  const storagePath = await uploadPrivateFile(user, file, m);
  if (storagePath === '__ERROR__') return;
  const payload = {
    user_id: user.id,
    title: document.getElementById('sourceTitle').value.trim(),
    author: document.getElementById('sourceAuthor').value.trim() || null,
    source_type: document.getElementById('sourceType').value,
    url: document.getElementById('sourceUrl').value.trim() || null,
    rights_status: document.getElementById('sourceRights').value,
    description: document.getElementById('sourceNotes').value.trim() || null,
    storage_path: storagePath,
  };
  if (!payload.title) {
    m.textContent = 'A title is required.';
    return;
  }
  const { error } = await supabase.from('source_submissions').insert(payload);
  if (error) {
    if (storagePath) await supabase.storage.from('oracle-private-sources').remove([storagePath]);
    m.textContent = error.message;
    return;
  }
  m.textContent = 'Submitted. Review status: pending.';
  document.getElementById('sourceForm').reset();
  loadSources();
}

async function loadSources() {
  const list = document.getElementById('sourceList');
  if (!list) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    list.innerHTML =
      '<p class="sourceHint">Sign in from Profile before submitting or viewing your private source submissions.</p>';
    return;
  }
  const { data, error } = await supabase
    .from('source_submissions')
    .select('title,author,source_type,rights_status,review_status,url,storage_path,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    list.innerHTML = '<p class="sourceHint">Unable to load submissions.</p>';
    return;
  }
  list.innerHTML = data?.length
    ? data
        .map(
          (r) =>
            `<div class="sourceRow"><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.author || 'Unknown author')} · ${escapeHtml(r.source_type)} · ${escapeHtml(r.rights_status)}</p><div class="sourceStatus">${escapeHtml(r.review_status)}</div>${r.url ? `<p><a href="${escapeAttr(r.url)}" target="_blank" rel="noopener">Open lawful source</a></p>` : ''}${r.storage_path ? '<p>Private file attached</p>' : ''}</div>`,
        )
        .join('')
    : '<p class="sourceHint">No submissions yet.</p>';
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c],
  );
}
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
addEventListener('DOMContentLoaded', build, { once: true });
