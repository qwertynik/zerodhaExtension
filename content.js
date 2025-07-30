// This script injects an 'Alerts' link into the nav bar on kite.zerodha.com and syncs inputs on /orders/alerts
(function() {
  // --- Insert Alerts Link in Nav ---
  function addAlertsLink() {
    const nav = document.querySelector('nav.app-nav');
    if (!nav) {
      console.log('[KiteExt] Nav not found');
      return;
    }
    if (nav.querySelector('a.orders-alerts-nav-item')) {
      return;
    }

    const ordersLink = nav.querySelector('a.orders-nav-item');
    if (!ordersLink) {
      console.log('[KiteExt] Orders link not found');
      return;
    }

    const alertsLink = document.createElement('a');
    alertsLink.href = '/orders/alerts';
    alertsLink.className = 'orders-alerts-nav-item';
    alertsLink.innerHTML = '<span>Alerts</span>';
    ordersLink.insertAdjacentElement('afterend', alertsLink);

    console.log('[KiteExt] Alerts link inserted');
  }

  // --- Sync Inputs inside the open modal on /orders/alerts ---
  let lastOmniInput = null, lastNameInput = null, lastMutationObserver = null, lastDropdownListener = null, modalObserver = null, dropdownPoller = null;
  function tryAttachInputSync() {
    if (!window.location.pathname.startsWith('/orders/alerts')) return;
    const modal = document.querySelector('.su-modal-container.layer-2');
    if (!modal) {
      console.log('[KiteExt] Waiting for modal to appear...');
      return;
    }
    const omnisearchInput = modal.querySelector('.omnisearch input[type="text"]');
    const nameWrapperInput = modal.querySelector('.name-wrapper input[type="text"]');
    if (!omnisearchInput || !nameWrapperInput) {
      return;
    }
    if (omnisearchInput === lastOmniInput && nameWrapperInput === lastNameInput) {
      // Already attached to these
      return;
    }
    lastOmniInput = omnisearchInput;
    lastNameInput = nameWrapperInput;
    if (omnisearchInput.dataset.kiteSyncAttached) {
      console.log('[KiteExt] Listener already attached to omnisearchInput (modal)');
      return;
    }
    console.log('[KiteExt] Attaching listeners and observer to omnisearchInput (modal):', omnisearchInput);
    omnisearchInput.dataset.kiteSyncAttached = 'true';
    const syncHandler = function(evt) {
      nameWrapperInput.value = omnisearchInput.value;
      nameWrapperInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[KiteExt] nameWrapperInput updated via', evt.type, 'New value:', nameWrapperInput.value);
    };
    omnisearchInput.addEventListener('input', syncHandler);
    omnisearchInput.addEventListener('change', syncHandler);
    // Fallback: global event listener for debugging
    window.addEventListener('input', function(e) {
      if (e.target === omnisearchInput) {
        console.log('[KiteExt] [window] omnisearch input event detected (modal). Value:', omnisearchInput.value);
      }
    }, true);

    // --- MutationObserver to catch programmatic value changes (e.g., dropdown selection) ---
    if (lastMutationObserver) lastMutationObserver.disconnect();
    lastMutationObserver = new MutationObserver(() => {
      nameWrapperInput.value = omnisearchInput.value;
      nameWrapperInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('[KiteExt] [MutationObserver] nameWrapperInput updated. New value:', nameWrapperInput.value);
    });
    lastMutationObserver.observe(omnisearchInput, { attributes: true, attributeFilter: ['value'] });

    // --- Observe modal for dropdown appearance and attach listeners ---
    if (modalObserver) modalObserver.disconnect();
    modalObserver = new MutationObserver(() => {
      const dropdownList = modal.querySelector('.omnisearch-results');
      if (dropdownList && !dropdownList.dataset.kiteDropdownListenerAttached) {
        // Mouse selection
        dropdownList.addEventListener('mousedown', function(e) {
          const li = e.target.closest('li.results-item');
          if (li) {
            setTimeout(() => {
              nameWrapperInput.value = omnisearchInput.value;
              nameWrapperInput.dispatchEvent(new Event('input', { bubbles: true }));
              console.log('[KiteExt] [dropdown mousedown] nameWrapperInput updated after dropdown selection. New value:', nameWrapperInput.value);
            }, 100);
          }
        });
        // Keyboard selection (Enter key)
        dropdownList.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            setTimeout(() => {
              nameWrapperInput.value = omnisearchInput.value;
              nameWrapperInput.dispatchEvent(new Event('input', { bubbles: true }));
              console.log('[KiteExt] [dropdown keydown] nameWrapperInput updated after keyboard selection. New value:', nameWrapperInput.value);
            }, 100);
          }
        });
        dropdownList.dataset.kiteDropdownListenerAttached = 'true';
        console.log('[KiteExt] Dropdown listeners attached to .omnisearch-results (via modal observer)');
      }
    });
    modalObserver.observe(modal, { childList: true, subtree: true });
    console.log('[KiteExt] Listeners and observer attached to omnisearchInput after popup appeared (modal)');
  }

  // Observe DOM for nav and alerts page
  const observer = new MutationObserver(() => {
    addAlertsLink();
    tryAttachInputSync();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // Initial run
  addAlertsLink();
  tryAttachInputSync();
  // Also poll every 500ms in case popup is rendered outside of mutation observer scope
  setInterval(tryAttachInputSync, 500);
})();
