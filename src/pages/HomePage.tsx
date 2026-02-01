export function HomePage() {
  // We now serve the static homepage directly at "/" (see `vercel.json` + `public/_redirects`).
  // This component exists only for SPA navigations to "/" (e.g. clicking "Home" from /events).
  // In that case, force a full navigation so the user lands on the real static homepage.
  //
  // Note: do NOT iframe the homepage anymore; the static page handles its own navigation.
  //
  // Use `replace` to avoid polluting history with an extra SPA entry.
  window.location.replace("/homepage.html");
  return null;
}
