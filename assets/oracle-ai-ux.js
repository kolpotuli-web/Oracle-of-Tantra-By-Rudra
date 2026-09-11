/* Oracle AI UX hardening for GitHub Pages + Supabase Edge Function. */
(() => {
  const message = 'The Oracle is online, but the free AI provider is unavailable. The interface is working. Add a free Gemini API key to the Supabase Edge Function (GEMINI_API_KEY), or restore a working Pollinations provider, then try again.';

  const cleanOldError = () => {
    document.querySelectorAll('#chatLog .bubble.assistant').forEach(node => {
      if (/could not reach the language service|OPENAI_API_KEY/i.test(node.textContent || '')) node.textContent = message;
      if (window.oracleCitations && !node.dataset.citationsRendered && /\[\[cite:[0-9a-fA-F-]{36}\]\]/.test(node.textContent || '')) {
        node.dataset.citationsRendered = '1';
        window.oracleCitations.renderCitations(node);
      }
    });
  };

  const observer = new MutationObserver(cleanOldError);
  const start = () => {
    const log = document.getElementById('chatLog');
    if (log) observer.observe(log, { childList: true, subtree: true, characterData: true });
    cleanOldError();
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
