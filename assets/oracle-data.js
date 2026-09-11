import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://bvnkoglvpljizeogslmp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ryjVjpVSMXv_HSbDUEsTZA_iZMc_w2G';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const localNotes = () => JSON.parse(localStorage.getItem('oracleNotes') || '[]');
const noteKey = n => `${n.title || ''}\u241f${n.body || ''}\u241f${n.time || ''}`;
let activeConversationId = null;
let syncTimer = null;

async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

async function ensureConversation(firstMessage = '') {
  if (activeConversationId) return activeConversationId;
  const user = await currentUser();
  if (!user) return null;
  const title = (firstMessage || 'Oracle research conversation').trim().slice(0, 90) || 'Oracle research conversation';
  const { data, error } = await supabase.from('conversations').insert({ user_id: user.id, title, language: localStorage.getItem('oracleLang') || 'en' }).select('id').single();
  if (!error && data?.id) activeConversationId = data.id;
  return activeConversationId;
}

async function saveMessage(role, content, firstUserMessage = '') {
  const user = await currentUser();
  if (!user || !content) return;
  const conversationId = await ensureConversation(firstUserMessage || content);
  if (!conversationId) return;
  await supabase.from('messages').insert({ conversation_id: conversationId, user_id: user.id, role, content });
  await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId).eq('user_id', user.id);
}

async function syncNotes() {
  const user = await currentUser();
  if (!user) return;
  const local = localNotes();
  if (!local.length) return;

  const { data: remote } = await supabase.from('notes').select('title,body,created_at').order('created_at', { ascending:false }).limit(100);
  const remoteKeys = new Set((remote || []).map(n => noteKey({ title:n.title, body:n.body, time:Date.parse(n.created_at) })));
  const pending = local.filter(n => !remoteKeys.has(noteKey(n)));
  if (!pending.length) return;

  const rows = pending.map(n => ({
    user_id: user.id,
    title: String(n.title || 'Untitled').slice(0, 180),
    body: String(n.body || '').slice(0, 20000),
    created_at: new Date(n.time || Date.now()).toISOString(),
    updated_at: new Date().toISOString()
  }));
  const { error } = await supabase.from('notes').insert(rows);
  if (!error && pending.length === local.length) localStorage.removeItem('oracleNotes');
}

async function restoreNotes() {
  const user = await currentUser();
  if (!user) return;
  const { data, error } = await supabase.from('notes').select('title,body,created_at').order('created_at', { ascending:false }).limit(100);
  if (error || !data) return;
  localStorage.setItem('oracleNotes', JSON.stringify(data.map(n => ({ title:n.title, body:n.body, time:Date.parse(n.created_at) }))));
  if (typeof window.renderNotes === 'function') window.renderNotes();
}

function showConnectionState() {
  currentUser().then(user => {
    const status = document.getElementById('status');
    if (!status) return;
    if (user) status.textContent = (user.email || 'Researcher') + ' · synced workspace';
  });
}

// Capture the existing /api/chat contract without changing the UI code.
const previousFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (!/\/api\/chat(?:\?|$)/.test(url)) return previousFetch(input, init);
  let requestBody = null;
  try { requestBody = init?.body ? JSON.parse(init.body) : null; } catch {}
  const userMessages = Array.isArray(requestBody?.messages) ? requestBody.messages : [];
  const latestUser = [...userMessages].reverse().find(m => m?.role === 'user')?.content || '';
  const response = await previousFetch(input, init);
  try {
    const copy = response.clone();
    const data = await copy.json();
    if (response.ok && data?.reply) {
      await saveMessage('user', latestUser, latestUser);
      await saveMessage('assistant', data.reply, latestUser);
    }
  } catch {}
  return response;
};

window.oracleData = Object.freeze({
  supabase,
  syncNotes,
  restoreNotes,
  showConnectionState,
  resetConversation: () => { activeConversationId = null; }
});

// Authentication itself is managed by oracle-auth.js; this module avoids a second note-restore loop.
syncTimer = setInterval(() => { syncNotes().catch(() => {}); }, 15000);
addEventListener('beforeunload', () => clearInterval(syncTimer));
addEventListener('DOMContentLoaded', () => setTimeout(showConnectionState, 400));
