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
function styles() {
  const s = document.createElement('style');
  s.textContent = `.conversationView{position:fixed;inset:0;z-index:66;background:rgba(28,18,13,.92);display:none;overflow:auto}.conversationView.open{display:block}.conversationCard{max-width:1080px;margin:70px auto 40px;background:#efdab2;border:1px solid #765039;box-shadow:0 20px 80px rgba(0,0,0,.55);padding:28px}.conversationClose{float:right;border:0;background:none;font-size:28px}.conversationList{border-top:1px solid #a27c55;margin-top:18px}.conversationRow{padding:15px 0;border-bottom:1px solid #b08b61;display:flex;justify-content:space-between;gap:15px;align-items:start}.conversationRow h3{margin:0 0 5px;font-weight:normal}.conversationRow p{margin:0;color:#5d4737}.conversationMeta{font-size:11px;color:#765c47}.conversationActions{display:flex;gap:6px;flex-wrap:wrap}@media(max-width:700px){.conversationCard{margin:10px;padding:18px}.conversationRow{display:block}.conversationActions{margin-top:10px}}`;
  document.head.appendChild(s);
}
async function user() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}
async function load() {
  const list = document.getElementById('conversationList');
  if (!list) return;
  const u = await user();
  if (!u) {
    list.innerHTML =
      '<p class="sourceHint">Sign in from Profile to view conversations saved across devices.</p>';
    return;
  }
  const { data, error } = await supabase
    .from('conversations')
    .select('id,title,language,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(100);
  if (error) {
    list.innerHTML = '<p class="sourceHint">Unable to load conversation history.</p>';
    return;
  }
  list.innerHTML = data?.length
    ? data
        .map(
          (c) =>
            `<article class="conversationRow"><div><h3>${esc(c.title || 'Untitled conversation')}</h3><p class="conversationMeta">${esc(c.language || 'en')} · ${new Date(c.updated_at || c.created_at).toLocaleString()}</p></div><div class="conversationActions"><button class="secondary" data-conversation="${c.id}">Open</button><button class="secondary" data-delete-conversation="${c.id}">Delete</button></div></article>`,
        )
        .join('')
    : '<p class="sourceHint">No saved conversations yet. Ask the Oracle while signed in to create one.</p>';
  list
    .querySelectorAll('[data-conversation]')
    .forEach((b) => (b.onclick = () => openConversation(b.dataset.conversation)));
  list
    .querySelectorAll('[data-delete-conversation]')
    .forEach((b) => (b.onclick = () => deleteConversation(b.dataset.deleteConversation)));
}
async function openConversation(id) {
  const u = await user();
  if (!u) return;
  const { data, error } = await supabase
    .from('messages')
    .select('role,content,created_at')
    .eq('conversation_id', id)
    .eq('user_id', u.id)
    .order('created_at', { ascending: true });
  if (error) {
    alert('Unable to open this conversation.');
    return;
  }
  const chat = document.getElementById('chat');
  const log = document.getElementById('chatLog');
  if (!chat || !log) return;
  log.innerHTML = '';
  for (const m of data || []) {
    const d = document.createElement('div');
    d.className = 'bubble ' + (m.role === 'user' ? 'user' : 'assistant');
    d.textContent = m.content;
    log.appendChild(d);
  }
  chat.classList.add('open');
  document.getElementById('conversationView')?.classList.remove('open');
  log.scrollTop = log.scrollHeight;
  window.oracleData?.resetConversation?.();
}
async function deleteConversation(id) {
  const u = await user();
  if (!u) return;
  if (!confirm('Delete this saved conversation?')) return;
  const { error } = await supabase.from('conversations').delete().eq('id', id).eq('user_id', u.id);
  if (error) {
    alert(error.message);
    return;
  }
  load();
}
function addNav() {
  const rail = document.querySelector('.rail');
  if (!rail || rail.querySelector('[data-conversation-nav]')) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = 'Conversations';
  b.dataset.conversationNav = '1';
  b.onclick = () => {
    document.getElementById('conversationView')?.classList.add('open');
    load();
  };
  rail.appendChild(b);
}
function build() {
  styles();
  addNav();
  const v = document.createElement('section');
  v.id = 'conversationView';
  v.className = 'conversationView';
  v.innerHTML =
    '<div class="conversationCard"><button class="conversationClose" id="conversationClose">×</button><div class="kicker">Research memory</div><h2>Conversations</h2><p class="sourceHint">Private Oracle conversations are stored under your researcher account.</p><div id="conversationList" class="conversationList"></div></div>';
  document.body.appendChild(v);
  document.getElementById('conversationClose').onclick = () => v.classList.remove('open');
  load();
}
addEventListener('DOMContentLoaded', build, { once: true });
