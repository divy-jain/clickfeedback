// ClickFeedback content script
(() => {
  const STATE = { last: null };

  function pickAttributes(el) {
    const attrs = {};
    for (const a of Array.from(el.attributes || [])) {
      if (a.name.startsWith('data-') || a.name.startsWith('aria-')) {
        attrs[a.name] = a.value;
      }
    }
    return attrs;
  }

  function cssEscape(val) {
    if (window.CSS && CSS.escape) return CSS.escape(val);
    return String(val).replace(/([!"#$%&'()*+,.\/;:<=>?@\[\]^`{|}~])/g, '\\$1');
  }

  function uniqueIdSelector(id) {
    if (!id) return null;
    const el = document.getElementById(id);
    return el ? `#${cssEscape(id)}` : null;
  }

  function nthChildSelector(el) {
    if (!el || !el.parentElement) return el.tagName.toLowerCase();
    const parent = el.parentElement;
    const index = Array.from(parent.children).indexOf(el) + 1;
    return `${el.tagName.toLowerCase()}:nth-child(${index})`;
  }

  function buildSelector(el) {
    if (!(el instanceof Element)) return null;
    const byId = uniqueIdSelector(el.id);
    if (byId) return byId;

    const parts = [];
    let cur = el;
    let depth = 0;
    while (cur && depth < 5) {
      let part = cur.tagName.toLowerCase();
      const cls = (cur.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2);
      if (cls.length) part += '.' + cls.map(cssEscape).join('.');
      if (!cur.id && (!cls.length || document.querySelectorAll(part).length > 1)) {
        part = nthChildSelector(cur);
      }
      parts.unshift(part);
      cur = cur.parentElement;
      depth++;
    }
    const sel = parts.join(' > ');
    try {
      const match = document.querySelectorAll(sel);
      if (match.length === 1) return sel;
    } catch (_) {}
    return sel;
  }

  function computeElementInfo(target) {
    if (!(target instanceof Element)) return null;
    const rect = target.getBoundingClientRect();
    return {
      selector: buildSelector(target),
      tagName: target.tagName,
      className: target.className?.toString() || '',
      id: target.id || '',
      textContent: (target.textContent || '').trim().slice(0, 200),
      attributes: pickAttributes(target),
      bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      url: location.href,
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      scroll: { x: window.scrollX, y: window.scrollY },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }

  document.addEventListener('contextmenu', (e) => {
    const t = e.target;
    STATE.last = computeElementInfo(t);
  }, true);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'CF_OPEN_MODAL') {
      openModal(msg.screenshot, STATE.last);
    }
  });

  function cropToElement(screenshot, bounds, padding = 8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const scaleX = img.width / window.innerWidth;
          const scaleY = img.height / window.innerHeight;
          const x = Math.max(0, Math.round((bounds.x - padding) * scaleX));
          const y = Math.max(0, Math.round((bounds.y - padding) * scaleY));
          const w = Math.min(img.width - x, Math.round((bounds.width + padding * 2) * scaleX));
          const h = Math.min(img.height - y, Math.round((bounds.height + padding * 2) * scaleY));
          const c = document.createElement('canvas');
          c.width = Math.max(1, w);
          c.height = Math.max(1, h);
          const ctx = c.getContext('2d');
          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
          resolve(c.toDataURL('image/png'));
        } catch (err) { reject(err); }
      };
      img.onerror = reject;
      img.src = screenshot;
    });
  }

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.assign(node, props);
    for (const c of children) node.append(c);
    return node;
  }

  async function openModal(screenshot, elementInfo) {
    const overlay = el('div', { className: 'cf-overlay', role: 'dialog', 'aria-modal': 'true' });
    overlay.dataset.open = 'true';
    const backdrop = el('div', { className: 'cf-backdrop' });

    let resizeObserver;
    const close = () => { 
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      overlay.remove(); 
    };

    const title = el('div', { className: 'cf-title', textContent: 'Give Feedback' });
    const btnClose = el('button', { className: 'cf-close', title: 'Close', innerHTML: '✕' });
    btnClose.addEventListener('click', close);

    const header = el('div', { className: 'cf-header' }, [title, btnClose]);

    // Preview
    let cropped = null;
    try {
      if (elementInfo?.bounds) {
        cropped = await cropToElement(screenshot, elementInfo.bounds, 12);
      }
    } catch (_) {}
    const shot = el('img', { className: 'cf-shot', src: cropped || screenshot, alt: 'Element screenshot preview' });

    const meta = el('div', { className: 'cf-meta' });
    if (elementInfo) {
      meta.textContent = `${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''} · ${new URL(location.href).hostname}`;
    }

    const preview = el('div', { className: 'cf-preview' }, [shot]);

    // Fields
    const fieldComment = el('div', { className: 'cf-field' }, [
      el('label', { htmlFor: 'cf_comment', textContent: 'What happened?' }),
      el('textarea', { id: 'cf_comment', className: 'cf-textarea', placeholder: 'Describe the issue or feedback…' })
    ]);

    const selectCategory = el('select', { id: 'cf_category', className: 'cf-select' }, [
      el('option', { value: 'bug', textContent: 'Bug' }),
      el('option', { value: 'design', textContent: 'Design' }),
      el('option', { value: 'usability', textContent: 'Usability' }),
      el('option', { value: 'performance', textContent: 'Performance' }),
      el('option', { value: 'feature', textContent: 'Feature' }),
      el('option', { value: 'other', textContent: 'Other' })
    ]);

    const selectPriority = el('select', { id: 'cf_priority', className: 'cf-select' }, [
      el('option', { value: 'low', textContent: 'Low' }),
      el('option', { value: 'medium', textContent: 'Medium' }),
      el('option', { value: 'high', textContent: 'High' }),
      el('option', { value: 'critical', textContent: 'Critical' })
    ]);

    const row = el('div', { className: 'cf-row' }, [
      el('div', { className: 'cf-field' }, [el('label', { htmlFor: 'cf_category', textContent: 'Category' }), selectCategory]),
      el('div', { className: 'cf-field' }, [el('label', { htmlFor: 'cf_priority', textContent: 'Priority' }), selectPriority])
    ]);

    const fieldEmail = el('div', { className: 'cf-field' }, [
      el('label', { htmlFor: 'cf_email', textContent: 'Email (optional)' }),
      el('input', { id: 'cf_email', type: 'email', className: 'cf-input', placeholder: 'you@company.com' })
    ]);

    const fields = el('div', { className: 'cf-fields' }, [fieldComment, row, fieldEmail]);

    const body = el('div', { className: 'cf-body' }, [preview, meta, fields]);

    const btnCancel = el('button', { className: 'cf-btn ghost', textContent: 'Cancel' });
    btnCancel.addEventListener('click', close);
    const btnSubmit = el('button', { className: 'cf-btn primary', textContent: 'Submit Feedback' });

    const footer = el('div', { className: 'cf-footer' }, [el('div', { className: 'cf-meta', textContent: 'Right‑click powered by ClickFeedback' }), el('div', {}, [btnCancel, btnSubmit])]);

    const modal = el('div', { className: 'cf-modal' }, [header, body, footer]);
    overlay.append(backdrop, modal);
    document.documentElement.appendChild(overlay);

    // Dynamic positioning and responsive behavior
    const adjustModalPosition = () => {
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const modalRect = modal.getBoundingClientRect();
      
      // Ensure modal doesn't exceed viewport height
      if (modalRect.height > viewportHeight - 40) {
        modal.style.maxHeight = `${viewportHeight - 40}px`;
      }
      
      // Ensure modal is centered and visible
      if (viewportWidth < 768) {
        overlay.style.padding = '10px';
      } else {
        overlay.style.padding = '20px';
      }
    };

    // Initial adjustment
    adjustModalPosition();
    
    // Adjust on window resize
    resizeObserver = new ResizeObserver(adjustModalPosition);
    resizeObserver.observe(modal);
    
    // Adjust on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(adjustModalPosition, 100);
    });

    const onKey = (ev) => { if (ev.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey, { once: true });

    btnSubmit.addEventListener('click', async () => {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Submitting…';
      try {
        const item = {
          id: `fb_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          status: 'open',
          priority: selectPriority.value,
          category: selectCategory.value,
          comment: (document.getElementById('cf_comment')).value,
          email: (document.getElementById('cf_email')).value || null,
          selector: elementInfo?.selector || null,
          element_info: elementInfo ? {
            tagName: elementInfo.tagName,
            className: elementInfo.className,
            textContent: elementInfo.textContent,
            attributes: elementInfo.attributes
          } : null,
          screenshot_url: cropped || screenshot,
          element_bounds: elementInfo?.bounds || null,
          page_info: elementInfo ? {
            url: elementInfo.url,
            title: elementInfo.title,
            viewport: elementInfo.viewport
          } : { url: location.href, title: document.title, viewport: { width: innerWidth, height: innerHeight } },
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        };

        const existing = await chrome.storage.local.get(['clickfeedback_items']);
        const items = Array.isArray(existing.clickfeedback_items) ? existing.clickfeedback_items : [];
        items.unshift(item);
        await chrome.storage.local.set({ clickfeedback_items: items });
        title.textContent = 'Thanks — feedback captured!';
        btnSubmit.textContent = 'Done';
        setTimeout(close, 700);
      } catch (e) {
        console.error('CF submit error', e);
        btnSubmit.textContent = 'Try again';
        btnSubmit.disabled = false;
      }
    });
  }
})();
