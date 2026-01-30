// Boot the correct entrypoint without changing the URL.
// Goal:
// - Phones at `/` should see the mobile landing experience (no `/mobile.html` in the address bar)
// - All other routes (e.g. `/events`) should load the main React SPA so routing works normally

function isPhoneDevice(): boolean {
  const userAgent = (navigator.userAgent || navigator.vendor || (window as any).opera || "").toLowerCase();
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // iPad mini (portrait) is 744px CSS width, keep that on desktop layout.
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  const isPhoneSized = shortSide <= 743;

  const isIPhoneOrIPod = /iphone|ipod/i.test(userAgent);
  const isAndroidPhone = /android/i.test(userAgent) && /mobile/i.test(userAgent);
  const isOtherPhone = /webos|blackberry|iemobile|opera mini/i.test(userAgent);

  return isTouchDevice && isPhoneSized && (isIPhoneOrIPod || isAndroidPhone || isOtherPhone);
}

async function boot() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const forceDesktop = urlParams.get("desktop") === "true" || sessionStorage.getItem("desktopVersion") === "true";
    const forceMobile = urlParams.get("mobile") === "true";

    const path = window.location.pathname;
    const isRootPath = path === "/" || path === "" || path === "/index.html";

    const shouldLoadMobile = !forceDesktop && (forceMobile || (isRootPath && isPhoneDevice()));

    if (shouldLoadMobile) {
      await import("./mobile/main");
      return;
    }

    await import("./main");
  } catch (error) {
    console.error("Failed to boot application:", error);
    // Show error message on page
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

