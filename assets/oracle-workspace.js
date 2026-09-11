import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://bvnkoglvpljizeogslmp.supabase.co',
  'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G',
);
const esc = (s) =>
  String(s || '').replace(
    /[&<>'"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c],
  );
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

function styles() {
  const s = document.createElement('style');
  s.textContent = `.workspaceDesk{position:fixed;inset:0;z-index:67;background:rgba(28,18,13,.94);display:none;overflow:auto}.workspaceDesk.open{display:block}.deskCard{max-width:1180px;margin:55px auto 45px;background:#efdab2;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:28px}.deskClose{float:right;border:0;background:none;font-size:28px}.deskHead{display:flex;justify-content:space-between;gap:20px;align-items:end}.deskHead h2{margin:0;font-weight:normal;font-size:34px}.deskHead p{margin:8px 0 0;color:#5d4737}.deskGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:20px 0}.deskStat{border:1px solid #a27c55;background:rgba(255,240,199,.48);padding:15px}.deskStat strong{display:block;font-size:28px;font-weight:normal}.deskStat span{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#765c47}.deskColumns{display:grid;grid-template-columns:1fr 1fr;gap:18px}.deskSection{border-top:1px solid #a27c55}.deskSection h3{font-weight:normal;margin:15px 0 8px}.deskRow{padding:11px 0;border-bottom:1px solid #b08b61}.deskRow strong{font-weight:normal}.deskRow p{margin:4px 0;color:#5d4737;line-height:1.4}.deskActions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.deskEmpty{color:#765c47;font-size:13px}.deskSignIn{text-align:center;padding:45px 10px}@media(max-width:850px){.deskCard{margin:10px;padding:18px}.deskGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.deskColumns{grid-template-columns:1fr}}@media(max-width:520px){.deskGrid{grid-template-columns:1fr 1fr}.deskHead{display:block}.deskHead h2{font-size:28px}}`;
  document.head.appendChild(s);
}
async function user() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}
function open() {
  document.getElementById('oracleWorkspace')?.classList.add('open');
  load();
}
function close() {
  document.getElementById('oracleWorkspace')?.classList.remove('open');
}
function addNav() {
  const rail = document.querySelector('.rail');
  if (!rail || rail.querySelector('[data-workspace-nav]')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = 'Workspace';
  b.dataset.workspaceNav = '1';
  b.onclick = open;
  rail.appendChild(b);
}
async function load() {
  const root = document.getElementById('workspaceBody');
  if (!root) return;
  const u = await user();
  if (!u) {
    root.innerHTML =
      '<div class="deskSignIn"><div class="kicker">Researcher workspace</div><h3>Sign in to open your desk</h3><p>Projects, notes, bookmarks and Oracle conversations stay tied to your private researcher account.</p><button class="primary" id="deskSignIn">Open Profile →</button></div>';
    document.getElementById('deskSignIn').onclick = () => {
      close();
      document.getElementById('profileBtn')?.click();
    };
    return;
  }
  const [projects, notes, bookmarks, conversations] = await Promise.all([
    supabase
      .from('research_projects')
      .select('id,title,question,status,updated_at')
      .order('updated_at', { ascending: false })
      .limit(4),
    supabase
      .from('notes')
      .select('id,title,body,updated_at,project_id')
      .order('updated_at', { ascending: false })
      .limit(4),
    supabase
      .from('bookmarks')
      .select('id,created_at,text_id,texts(title,slug,tradition)')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('conversations')
      .select('id,title,language,updated_at,project_id')
      .order('updated_at', { ascending: false })
      .limit(4),
  ]);
  const error = [projects, notes, bookmarks, conversations].find((r) => r.error);
  if (error) {
    root.innerHTML = '<div class="deskEmpty">Unable to load the researcher desk right now.</div>';
    return;
  }
  const ps = projects.data || [],
    ns = notes.data || [],
    bs = bookmarks.data || [],
    cs = conversations.data || [];
  root.innerHTML = `<div class="deskGrid"><div class="deskStat"><strong>${ps.length}</strong><span>Recent projects</span></div><div class="deskStat"><strong>${ns.length}</strong><span>Recent notes</span></div><div class="deskStat"><strong>${bs.length}</strong><span>Saved texts</span></div><div class="deskStat"><strong>${cs.length}</strong><span>Conversations</span></div></div><div class="deskColumns"><section><div class="kicker">Active research</div><div class="deskSection"><h3>Projects</h3>${ps.length ? ps.map((p) => `<article class="deskRow"><strong>${esc(p.title)}</strong><p>${esc(p.question || 'No question yet.')} · ${esc(p.status)} · ${fmt(p.updated_at)}</p><div class="deskActions"><button class="secondary" data-open-project="${p.id}">Open</button></div></article>`).join('') : '<p class="deskEmpty">No projects yet.</p>'}</div><div class="deskSection"><h3>Notes</h3>${ns.length ? ns.map((n) => `<article class="deskRow"><strong>${esc(n.title)}</strong><p>${esc((n.body || '').slice(0, 150))}${(n.body || '').length > 150 ? '…' : ''} · ${fmt(n.updated_at)}</p></article>`).join('') : '<p class="deskEmpty">No notes yet.</p>'}</div></section><section><div class="kicker">Library memory</div><div class="deskSection"><h3>Bookmarked texts</h3>${bs.length ? bs.map((b) => `<article class="deskRow"><strong>${esc(b.texts?.title || 'Saved text')}</strong><p>${esc(b.texts?.tradition || '')} · ${fmt(b.created_at)}</p><div class="deskActions"><button class="secondary" data-open-book="${esc(b.texts?.slug || '')}">Open text</button></div></article>`).join('') : '<p class="deskEmpty">No bookmarks yet.</p>'}</div><div class="deskSection"><h3>Recent conversations</h3>${cs.length ? cs.map((c) => `<article class="deskRow"><strong>${esc(c.title || 'Untitled conversation')}</strong><p>${esc(c.language || 'en')} · ${fmt(c.updated_at)}</p><div class="deskActions"><button class="secondary" data-open-conversation="${c.id}">Open</button></div></article>`).join('') : '<p class="deskEmpty">No saved conversations yet.</p>'}</div></section></div>`;
  root.querySelectorAll('[data-open-project]').forEach(
    (b) =>
      (b.onclick = () => {
        close();
        document.getElementById('projectList') &&
          document.getElementById('oracleProjects')?.classList.add('open');
        window.setTimeout(
          () =>
            document
              .querySelector(`[data-project="${CSS.escape(b.dataset.openProject)}"]`)
              ?.click(),
          100,
        );
      }),
  );
  root.querySelectorAll('[data-open-conversation]').forEach(
    (b) =>
      (b.onclick = () => {
        close();
        document.getElementById('conversationView')?.classList.add('open');
        window.setTimeout(
          () =>
            document
              .querySelector(`[data-conversation="${CSS.escape(b.dataset.openConversation)}"]`)
              ?.click(),
          100,
        );
      }),
  );
  root.querySelectorAll('[data-open-book]').forEach(
    (b) =>
      (b.onclick = () => {
        close();
        const nav = [...document.querySelectorAll('.rail button')].find(
          (x) => x.dataset.view === 'library',
        );
        if (nav) nav.click();
        setTimeout(() => {
          document.querySelector(`[data-text-slug="${CSS.escape(b.dataset.openBook)}"]`)?.click() ||
            document.querySelector(`[data-book="${CSS.escape(b.dataset.openBook)}"]`)?.click();
        }, 100);
      }),
  );
}
function build() {
  styles();
  addNav();
  const v = document.createElement('section');
  v.id = 'oracleWorkspace';
  v.className = 'workspaceDesk';
  v.innerHTML =
    '<div class="deskCard"><button class="deskClose" id="workspaceClose">×</button><div class="deskHead"><div><div class="kicker">The researcher\'s desk</div><h2>Workspace</h2><p>One place for your projects, notes, saved texts and Oracle conversations.</p></div><button class="secondary" id="workspaceRefresh">Refresh</button></div><div id="workspaceBody"></div></div>';
  document.body.appendChild(v);
  document.getElementById('workspaceClose').onclick = close;
  document.getElementById('workspaceRefresh').onclick = load;
}
addEventListener('DOMContentLoaded', build, { once: true });
supabase.auth.onAuthStateChange(() => {
  if (document.getElementById('oracleWorkspace')?.classList.contains('open')) load();
});
