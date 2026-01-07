// Unregister any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    debugLog('sw_registrations', { count: regs.length });
    regs.forEach(r => r.unregister());
  }).catch(err => {
    debugError('sw_unregister_error', { message: String(err) });
  });
}
