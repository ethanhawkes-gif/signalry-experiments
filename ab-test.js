// A/B Testing Framework for Experiment Factory
(function() {
  const STORAGE_KEY = 'exp_variant';
  const ENDPOINT = 'https://formspree.io/f/xpzvqwka'; // Analytics collector
  
  // Get or assign variant
  function getVariant(expId, variants) {
    const key = STORAGE_KEY + '_' + expId;
    let variant = localStorage.getItem(key);
    if (!variant || !variants.includes(variant)) {
      variant = variants[Math.floor(Math.random() * variants.length)];
      localStorage.setItem(key, variant);
    }
    return variant;
  }
  
  // Track event
  function track(event, data) {
    const payload = {
      event: event,
      experiment: window.EXP_ID || 'unknown',
      variant: window.EXP_VARIANT || 'unknown',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...data
    };
    
    // Send to Plausible custom event
    if (window.plausible) {
      plausible(event, { props: payload });
    }
    
    // Also beacon to our collector
    navigator.sendBeacon && navigator.sendBeacon(
      ENDPOINT,
      JSON.stringify(payload)
    );
  }
  
  // Apply variant changes to DOM
  function applyVariant(variant, config) {
    if (!config || !config[variant]) return;
    
    const changes = config[variant];
    
    if (changes.headline) {
      const h1 = document.querySelector('h1');
      if (h1) h1.textContent = changes.headline;
    }
    
    if (changes.cta) {
      const btn = document.querySelector('.btn-primary');
      if (btn) btn.textContent = changes.cta;
    }
    
    if (changes.price) {
      const price = document.querySelector('.price-tag');
      if (price) price.innerHTML = changes.price;
    }
    
    if (changes.hideElement) {
      const el = document.querySelector(changes.hideElement);
      if (el) el.style.display = 'none';
    }
  }
  
  // Initialize
  window.ABTest = {
    init: function(expId, variants, config) {
      window.EXP_ID = expId;
      window.EXP_VARIANT = getVariant(expId, variants);
      
      // Apply DOM changes
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => applyVariant(window.EXP_VARIANT, config));
      } else {
        applyVariant(window.EXP_VARIANT, config);
      }
      
      // Track pageview with variant
      track('pageview', {});
      
      // Track scroll depth
      let maxScroll = 0;
      window.addEventListener('scroll', () => {
        const scrollPct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPct > maxScroll) maxScroll = scrollPct;
      });
      
      // Track exit
      window.addEventListener('beforeunload', () => {
        track('exit', { scroll_depth: maxScroll, time_on_page: Math.round(performance.now() / 1000) });
      });
      
      return window.EXP_VARIANT;
    },
    
    track: track
  };
})();
