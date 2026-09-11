/* The Oracle of Tantra — generated visual asset registry. */
window.ORACLE_ASSETS = Object.freeze({
  /* Clean desktop artwork: male Oracle, moon, river, books, black cat, no interface. */
  masterDesktop: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a4-bedc-f96275ca9f32.png',
  /* Re-composed mobile artwork with the same male Oracle and black cat. */
  masterMobile: 'https://cdn.creativeclaw.co/u/486ee905/images/ca527432-87f0-46a9-b085-1a6d2c951dc9.png',
  oracle: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a4-bedc-f96275ca9f32.png',
  bookshelf: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a4-bedc-f96275ca9f32.png',
  centralArch: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a9-b85f-b98dd483403b.png',
  objectsSprite: 'https://cdn.creativeclaw.co/u/486ee905/images/ad8ced9c-e169-46a9-b085-1a6d2c951dc9.png',
  AI_ENDPOINT: 'https://bvnkoglvpljizeogslmp.supabase.co/functions/v1/oracle-chat',
  local: {
    masterDesktop: 'assets/generated/oracle-tantra-master-desktop.png',
    masterMobile: 'assets/generated/oracle-tantra-master-mobile.png',
    oracle: 'assets/generated/oracle-tantra-oracle.png',
    bookshelf: 'assets/generated/oracle-tantra-bookshelf.png',
    centralArch: 'assets/generated/oracle-tantra-central-arch.png',
    objectsSprite: 'assets/generated/oracle-tantra-objects.png'
  }
});

/* GitHub Pages has no /api server. Route the existing frontend contract to the free Supabase Edge Function. */
(() => {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (/\/api\/chat(?:\?|$)/.test(url)) {
      return nativeFetch(window.ORACLE_ASSETS.AI_ENDPOINT, init);
    }
    return nativeFetch(input, init);
  };

  /* Keep the Oracle chat from obscuring the research framework on desktop. */
  const style = document.createElement('style');
  style.textContent = `
    body.oracle-chat-open #viewResearch.open .workspaceCard { padding-bottom: 560px; }
    body.oracle-chat-open #viewResearch.open .twoCol { grid-template-columns: 1fr; }
    body.oracle-chat-open .chat { width:min(560px,calc(100vw - 36px)); right:18px; bottom:18px; height:min(500px,55vh); }
    @media (max-width:900px){ body.oracle-chat-open #viewResearch.open .workspaceCard{padding-bottom:500px} }
    @media (max-width:600px){ body.oracle-chat-open #viewResearch.open .workspaceCard{padding-bottom:20px} body.oracle-chat-open .chat{height:78vh;right:8px;bottom:8px;width:calc(100vw - 16px)} }
  `;
  document.head.appendChild(style);

  const syncChatState = () => document.body.classList.toggle('oracle-chat-open', document.querySelector('#chat')?.classList.contains('open'));
  new MutationObserver(syncChatState).observe(document.documentElement, { subtree:true, attributes:true, attributeFilter:['class'] });
  addEventListener('DOMContentLoaded', syncChatState, { once:true });
})();

/* Load persistent research data before the authentication module. */
addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('script[src="assets/oracle-data.js"]')) {
    const dataScript = document.createElement('script');
    dataScript.type = 'module';
    dataScript.src = 'assets/oracle-data.js';
    document.body.appendChild(dataScript);
  }

  if (!document.querySelector('script[src="assets/oracle-auth.js"]')) {
    const authScript = document.createElement('script');
    authScript.type = 'module';
    authScript.src = 'assets/oracle-auth.js';
    document.body.appendChild(authScript);
  }
}, { once:true });
