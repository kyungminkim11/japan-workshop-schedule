window.WORKSHOP_SUPABASE = {
  // Supabase Dashboard > Project Settings > API Keys
  // Use Project URL and anon public / publishable key only.
  // Never paste service_role, secret key, JWT secret, or database password here.
  url: "https://jnciddblcndmthmmvqrz.supabase.co",
  key: "sb_publishable_UUzSE7O9wqI0WN9cKG9OAQ_VleRkL4I"
};

// Compatibility bridge: the deployed frontend now calls workshop_login(p_code, p_client_info),
// but the current Supabase database may still expose the older workshop_login(p_pin).
// This keeps login from failing with "Could not find the function ... in the schema cache".
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
