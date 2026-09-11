/* The Oracle of Tantra — keyboard, focus and accessibility hardening. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    .oracleSkip{position:fixed;left:12px;top:12px;z-index:300;padding:10px 14px;background:#71342b;color:#f5dfb5;border:1px solid #e8c98f;transform:translateY(-160%);transition:transform .15s ease}
    .oracleSkip:focus{transform:none}
    :where(button,a,input,textarea,select):focus-visible{outline:2px solid #d4aa64;outline-offset:2px}
  `;
  document.head.appendChild(style);

  function topOpenLayer() {
    const selectors = [
      '.modal.open',
      '.drawer.open',
      '.view.open',
      '.chat.open',
      '.projectView.open',
      '.conversationView.open',
      '.bookmarkView.open',
      '.sourceView.open',
      '.adminView.open',
      '.corpusView.open',
      '.oracleLanguagePicker.open',
    ];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }
  function closeLayer(layer) {
    if (!layer) return false;
    const close = layer.querySelector('button.close,button[id$="Close"],button[id$="X"],.close');
    if (close) {
      close.click();
      return true;
    }
    layer.classList.remove('open');
    return true;
  }
  function restoreFocus(target) {
    if (target && typeof target.focus === 'function')
      setTimeout(() => target.focus({ preventScroll: true }), 0);
  }

  function installSkip() {
    if (document.getElementById('oracleSkip')) return;
    const a = document.createElement('a');
    a.id = 'oracleSkip';
    a.className = 'oracleSkip';
    a.href = '#main-research-content';
    a.textContent = 'Skip to research content';
    document.body.prepend(a);
    const main = document.querySelector(
      '#viewResearch .workspaceCard,#viewLibrary .workspaceCard,.workspaceCard',
    );
    if (main) {
      main.id = 'main-research-content';
      main.setAttribute('tabindex', '-1');
    }
  }

  function enhanceDialogs() {
    document
      .querySelectorAll(
        '.modal,.drawer,.view,.chat,.projectView,.conversationView,.bookmarkView,.sourceView,.adminView,.corpusView,.oracleLanguagePicker',
      )
      .forEach((el) => {
        if (!el.hasAttribute('role')) el.setAttribute('role', 'dialog');
        if (!el.hasAttribute('aria-modal')) el.setAttribute('aria-modal', 'true');
      });
  }

  let lastTrigger = null;
  document.addEventListener(
    'click',
    (e) => {
      const trigger = e.target.closest('button,a,[data-view]');
      if (trigger) lastTrigger = trigger;
      const openState = topOpenLayer();
      if (openState) {
        const focusable = openState.querySelector(
          'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
        );
        if (document.activeElement === document.body && focusable) focusable.focus();
      }
    },
    true,
  );

  document.addEventListener('keydown', (e) => {
    const layer = topOpenLayer();
    if (e.key === 'Escape' && layer) {
      e.preventDefault();
      closeLayer(layer);
      restoreFocus(lastTrigger);
      return;
    }
    if (e.key !== 'Tab' || !layer) return;
    const items = [
      ...layer.querySelectorAll(
        'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    ].filter((x) => x.getClientRects().length);
    if (!items.length) return;
    const first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  const observer = new MutationObserver(() => enhanceDialogs());
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  addEventListener(
    'DOMContentLoaded',
    () => {
      installSkip();
      enhanceDialogs();
    },
    { once: true },
  );
})();
