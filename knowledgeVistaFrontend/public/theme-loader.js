// Theme loading functionality
window.addEventListener('DOMContentLoaded', () => {
  const fetchTheme = async () => {
    try {
      const theme = sessionStorage.getItem("theme");

      if (theme) {
        updateCSSVariables(JSON.parse(theme));
      } else {
        if (!window.baseUrl) {
          console.error("❌ baseUrl is not defined.");
          return;
        }

        const response = await axios.get(`${window.baseUrl}/getTheme`);
        const colors = response.data;
        updateCSSVariables(colors);
        sessionStorage.setItem("theme", JSON.stringify(colors));
      }
    } catch (err) {
      console.error("❌ Error fetching theme:", err);
    }
  };

  const updateCSSVariables = (colors) => {
    const styleTag = document.getElementById('theme-style');
    if (!styleTag) return;

    styleTag.innerHTML = `
      :root {
        --primary: ${colors.primaryColor};
        --lightprimary: ${colors.lightPrimaryColor};
      }
    `;
  };

  fetchTheme();
});
