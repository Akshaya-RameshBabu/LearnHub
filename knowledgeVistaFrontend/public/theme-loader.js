window.addEventListener("DOMContentLoaded", () => {
  const baseUrlMeta = document.querySelector("meta[name='api-base-url']");
  const baseUrl = baseUrlMeta ? baseUrlMeta.content : null;
  if (!baseUrl) {
    console.error("❌ baseUrl not found in meta tag");
    return;
  }
  window.baseUrl = baseUrl;

  const styleTag = document.getElementById("theme-style");

  // 1️⃣ First try to apply theme from localStorage immediately
  // --- Changed from sessionStorage to localStorage ---
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme && styleTag) {
    try {
      const colors = JSON.parse(storedTheme);
      styleTag.innerHTML = `
        :root {
          --primary: ${colors.primaryColor};
          --lightprimary: ${colors.lightPrimaryColor};
        }
      `;
    } catch (e) {
      console.error("Invalid stored theme:", e);
    }
  }

  // 2️⃣ Then fetch theme from API only if not in storage
  if (!storedTheme) {
    axios.get(`${baseUrl}/getTheme`)
      .then((res) => {
        const colors = res.data;
        if (styleTag) {
          styleTag.innerHTML = `
            :root {
              --primary: ${colors.primaryColor};
              --lightprimary: ${colors.lightPrimaryColor};
            }
          `;
        }
        console.log("changing colour")
        // --- Changed from sessionStorage to localStorage ---
        localStorage.setItem("theme", JSON.stringify(colors));
      })
      .catch((err) => {
        console.error("❌ Failed to fetch theme:", err);
      });
  }
});