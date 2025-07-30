// This script injects an 'Alerts' link into the nav bar on kite.zerodha.com
(function() {
  // Wait for the DOM to be fully loaded
  function addAlertsLink() {
    const nav = document.querySelector('nav.app-nav');
    if (!nav) return;

    // Prevent duplicate insertion
    if (nav.querySelector('a.orders-alerts-nav-item')) return;

    // Find the Orders link
    const ordersLink = nav.querySelector('a.orders-nav-item');
    if (!ordersLink) return;

    // Create the Alerts link
    const alertsLink = document.createElement('a');
    alertsLink.href = '/orders/alerts';
    alertsLink.className = 'orders-alerts-nav-item';
    alertsLink.innerHTML = '<span>Alerts</span>';

    // Insert after Orders link
    ordersLink.insertAdjacentElement('afterend', alertsLink);
  }

  // Run once DOM is ready, and also on future nav changes (SPA)
  const observer = new MutationObserver(addAlertsLink);
  observer.observe(document.body, { childList: true, subtree: true });
  // Initial run
  addAlertsLink();
})();
