// Single entrypoint.
//
// The site homepage is served as the static `homepage.html` for desktop/tablet,
// and the phone-sized experience is served from `mobile.html`.
// We keep the React SPA for internal routes like `/events`, `/privacy-policy`, etc.
async function boot() {
  try {
    await import("./main");
  } catch (error) {
    console.error("Failed to boot application:", error);
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; color: #fff; padding: 20px; font-family: system-ui, sans-serif;">
          <div style="max-width: 600px; text-align: center;">
            <h1 style="color: #ef4444; margin-bottom: 16px;">Application Error</h1>
            <p style="color: #9ca3af; margin-bottom: 24px;">Failed to load the application. Please check the console for details.</p>
            <button onclick="window.location.reload()" style="padding: 12px 24px; background: #fff; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
              Reload Page
            </button>
            <details style="margin-top: 24px; text-align: left;">
              <summary style="cursor: pointer; color: #9ca3af; margin-bottom: 8px;">Error Details</summary>
              <pre style="background: #1f2937; padding: 16px; border-radius: 6px; overflow: auto; font-size: 12px; color: #ef4444;">
${error instanceof Error ? error.stack : String(error)}
              </pre>
            </details>
          </div>
        </div>
      `;
    }
  }
}

boot();

