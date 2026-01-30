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
}

boot();

