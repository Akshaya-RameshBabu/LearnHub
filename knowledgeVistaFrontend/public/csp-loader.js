// ⚠️ WARNING: Do not change the backend URL in the code.
// Edit it in 'public/config.json'. This file remains editable after the React app is built.

fetch("config.json")
  .then((response) => response.json())
  .then((config) => {
    const baseUrl = config.REACT_APP_API_URL;
    window.baseUrl = baseUrl;
    const cspMeta = document.createElement("meta");
    cspMeta.httpEquiv = "Content-Security-Policy";
    cspMeta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://code.jquery.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.youtube.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      media-src 'self' ${baseUrl};
      connect-src 'self' ${baseUrl} https://www.googletagmanager.com https://api.country.is https://restcountries.com https://ipapi.co;
      frame-src https://www.googletagmanager.com https://www.youtube.com;
      child-src https://www.googletagmanager.com https://www.youtube.com;
      frame-ancestors 'self';
    `.replace(/\s+/g, " ").trim();

    // Remove any existing CSP tag (precautionary)
    const existing = document.querySelector("meta[http-equiv='Content-Security-Policy']");
    if (existing) document.head.removeChild(existing);

    document.head.appendChild(cspMeta);

    // Optionally: load your theme or other JS after CSP and baseUrl are ready
    const themeScript = document.createElement("script");
    themeScript.src = "theme-loader.js";
    document.head.appendChild(themeScript);
  })
  .catch((error) => {
    console.error("❌ Failed to load config.json", error);
  });
