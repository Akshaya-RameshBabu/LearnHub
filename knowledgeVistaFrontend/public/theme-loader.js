// Theme loading functionality
window.addEventListener('DOMContentLoaded', (event) => {
  const fetchTheme = async () => {
    try {
      const theme = sessionStorage.getItem("theme");

      if (theme) {
        const colors = JSON.parse(theme);
        updateCSSVariables(colors);
      } else {
        const response = await axios.get(`${baseUrl}/getTheme`);
        const colors = response.data;
        updateCSSVariables(colors);
        sessionStorage.setItem("theme", JSON.stringify(colors));
      }
    } catch (err) {
      console.error("Error fetching theme:", err);
    }
  };

  const updateCSSVariables = (colors) => {
    const styleTag = document.getElementById('theme-style');
    const rootStyles = getComputedStyle(document.documentElement);
    const currentPrimary = rootStyles.getPropertyValue('--primary').trim();
    const currentLightPrimary = rootStyles.getPropertyValue('--lightprimary').trim();

    if (currentPrimary !== colors.primaryColor || currentLightPrimary !== colors.lightPrimaryColor) {
      styleTag.innerHTML = `
        :root {
          --primary: ${colors.primaryColor};
          --lightprimary: ${colors.lightPrimaryColor};
        }
      `;
    }
  };

  fetchTheme();
});