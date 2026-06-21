window.WORKSHOP_SUPABASE = {
  // Supabase Dashboard > Project Settings > API Keys
  // Use Project URL and anon public / publishable key only.
  // Never paste service_role, secret key, JWT secret, or database password here.
  url: "https://jnciddblcndmthmmvqrz.supabase.co",
  key: "sb_publishable_UUzSE7O9wqI0WN9cKG9OAQ_VleRkL4I"
};

// Compatibility bridge for older Supabase RPC signatures.
(function () {
  const schemaErrorPattern = /schema cache|could not find the function|pgrst202/i;
  const patch = () => {
    if (!window.supabase || !window.supabase.createClient || window.__workshopCompatPatched) return;
    const originalCreateClient = window.supabase.createClient.bind(window.supabase);
    window.supabase.createClient = function (...args) {
      const client = originalCreateClient(...args);
      const originalRpc = client.rpc.bind(client);
      client.rpc = async function (fn, params = {}, options) {
        if (fn === "workshop_login" && params && Object.prototype.hasOwnProperty.call(params, "p_code")) {
          const first = await originalRpc(fn, params, options);
          const message = [first?.error?.message, first?.error?.details, first?.error?.hint].filter(Boolean).join(" ");
          if (!first?.error || !schemaErrorPattern.test(message)) return first;
          return originalRpc(fn, { p_pin: params.p_code }, options);
        }
        if (fn === "workshop_add_photo" && params && Object.prototype.hasOwnProperty.call(params, "p_shared_with_girlfriend")) {
          const first = await originalRpc(fn, params, options);
          const message = [first?.error?.message, first?.error?.details, first?.error?.hint].filter(Boolean).join(" ");
          if (!first?.error || !schemaErrorPattern.test(message)) return first;
          const fallback = { ...params };
          delete fallback.p_shared_with_girlfriend;
          return originalRpc(fn, fallback, options);
        }
        return originalRpc(fn, params, options);
      };
      return client;
    };
    window.__workshopCompatPatched = true;
  };
  patch();
})();

// Load optional feature patches after the base app has mounted.
(function () {
  const scripts = [
    "gift-list-patch.js?v=20260617-gifts-1",
    "media-export-patch.js?v=20260617-media-1",
    "comment-request-patch.js?v=20260617-comment-1",
    "free-post-patch.js?v=20260617-post-1",
    "gallery-picker-patch.js?v=20260617-gallery-1",
    "post-group-patch.js?v=20260617-group-1",
    "post-single-view-patch.js?v=20260617-single-1",
    "timeline-day-filter.js?v=20260617-day-1",
    "timeline-multi-download.js?v=20260617-download-1",
    "post-swipe-gallery.js?v=20260617-swipe-1",
    "home-quick-composer.js?v=20260617-composer-1",
    "new-content-alert.js?v=20260617-alert-1",
    "quick-post-fab.js?v=20260617-fab-1",
    "ux-polish.js?v=20260619-ux-1",
    "report-projects.js?v=20260620-report-1",
    "kingdom-note-report-patch.js?v=20260622-kingdom-1",
    "schedule-video-patch.js?v=20260622-video-1",
    "go.js?v=20260617-quick-1"
  ];

  const loadScript = (src) => {
    if (document.querySelector(`script[src*="${src.split("?")[0]}"]`)) return;
    const script = document.createElement("script");
    script.src = src;
    document.head.appendChild(script);
  };

  const loadFeaturePatches = () => scripts.forEach(loadScript);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadFeaturePatches, { once: true });
  else loadFeaturePatches();
})();
