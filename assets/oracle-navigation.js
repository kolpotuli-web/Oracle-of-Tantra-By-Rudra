(() => {
  const CLOSE_SELECTORS = ['#textRecordView', '.adminView', '.modal', '.drawer', '.chat'];
  function closeElement(el) {
    if (!el) return;
    if (el.id === 'textRecordView' && window.oracleTextPages?.close) {
      window.oracleTextPages.close();
      return;
    }
    if (el.classList.contains('chat')) {
      el.classList.remove('open');
      document.body.classList.remove('oracle-chat-open');
      return;
    }
    if (el.classList.contains('drawer')) {
      el.classList.remove('open');
      return;
    }
    el.classList.remove('open');
    if (el.matches('.view')) {
      el.setAttribute('aria-hidden', 'true');
      document.querySelector('[data-view="home"]')?.click();
    }
  }
  function addBackButtons() {
    document.querySelectorAll('.view').forEach((view) => {
      const card = view.querySelector('.workspaceCard');
      if (!card || card.querySelector('.pageBack')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pageBack secondary';
      b.textContent = '← Back';
      b.setAttribute('aria-label', 'Back to the manuscript');
      b.addEventListener('click', () => closeElement(view));
      card.insertBefore(b, card.firstChild);
    });
    document.querySelectorAll('.adminView').forEach((view) => {
      const card = view.querySelector('.adminCard');
      if (!card || card.querySelector('.pageBack')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pageBack secondary';
      b.textContent = '← Back';
      b.setAttribute('aria-label', 'Back to the manuscript');
      b.addEventListener('click', () => closeElement(view));
      card.insertBefore(b, card.firstChild);
    });
  }
  function outsideClick(e) {
    if (e.target?.closest?.('.close,[data-close]')) return;
    document
      .querySelectorAll('.view.open,.modal.open,.adminView.open,#textRecordView')
      .forEach((el) => {
        if (e.target === el) closeElement(el);
      });
    document.querySelectorAll('.drawer.open,.chat.open').forEach((el) => {
      if (!el.contains(e.target)) closeElement(el);
    });
  }
  function keydown(e) {
    if (e.key !== 'Escape') return;
    for (const selector of CLOSE_SELECTORS) {
      const el =
        document.querySelector(selector + '.open') ||
        (selector === '#textRecordView'
          ? document.querySelector('#textRecordView[style*="block"]')
          : null);
      if (el) {
        closeElement(el);
        break;
      }
    }
  }
  function styles() {
    if (document.getElementById('oracleNavigationStyles')) return;
    const s = document.createElement('style');
    s.id = 'oracleNavigationStyles';
    s.textContent = `.pageBack{display:inline-flex!important;align-items:center;gap:6px;margin-bottom:16px}.pageBack:focus-visible{outline:3px solid #8d342c;outline-offset:3px}.view>.workspace{position:relative}`;
    document.head.appendChild(s);
  }
  function install() {
    styles();
    addBackButtons();
    document.addEventListener('click', outsideClick, true);
    document.addEventListener('keydown', keydown);
    new MutationObserver(addBackButtons).observe(document.body, { subtree: true, childList: true });
  }
  if (document.readyState === 'loading')
    addEventListener('DOMContentLoaded', install, { once: true });
  else install();
  window.oracleNavigation = { closeElement, addBackButtons };
})();
