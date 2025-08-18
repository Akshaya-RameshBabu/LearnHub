window.addEventListener("DOMContentLoaded", () => {
    const metaTag = document.querySelector("meta[name='api-base-url']");
    const baseUrl = metaTag?.content;

    if (!baseUrl) {
        console.error("❌ baseUrl not found in meta tag.");
        return;
    }

    window.baseUrl = baseUrl;

    const cspMeta = document.createElement("meta");
    cspMeta.httpEquiv = "Content-Security-Policy";
    cspMeta.content = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' https://code.jquery.com https://cdn.jsdelivr.net https://www.googletagmanager.com https://www.youtube.com https://js.stripe.com https://googleads.g.doubleclick.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https:;
        media-src 'self' ${baseUrl};
        connect-src 'self' ${new URL(baseUrl).origin} https://www.googletagmanager.com https://googleads.g.doubleclick.net https://api.country.is https://restcountries.com https://ipapi.co https://js.stripe.com;
        frame-src https://www.googletagmanager.com https://www.youtube.com https://js.stripe.com;
        child-src https://www.googletagmanager.com https://www.youtube.com https://js.stripe.com;
    `.replace(/\s+/g, " ").trim();

    const existingCSP = document.querySelector("meta[http-equiv='Content-Security-Policy']");
    if (existingCSP) document.head.removeChild(existingCSP);

    document.head.appendChild(cspMeta);
});
