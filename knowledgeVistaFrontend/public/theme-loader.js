window.addEventListener("DOMContentLoaded", () => {
  const baseUrlMeta = document.querySelector("meta[name='api-base-url']");
  const baseUrl = baseUrlMeta ? baseUrlMeta.content : null;
  if (!baseUrl) {
    console.error("❌ baseUrl not found in meta tag");
    return;
  }

  window.baseUrl = baseUrl;

  // Example: Load theme
  axios.get(`${baseUrl}/getTheme`)
    .then((res) => {
      const colors = res.data;
      const styleTag = document.getElementById("theme-style");
      if (!styleTag) return;
      styleTag.innerHTML = `
        :root {
          --primary: ${colors.primaryColor};
          --lightprimary: ${colors.lightPrimaryColor};
        }
      `;
      sessionStorage.setItem("theme", JSON.stringify(colors));
    })
    .catch((err) => {
      console.error("❌ Failed to fetch theme:", err);
    });
});
