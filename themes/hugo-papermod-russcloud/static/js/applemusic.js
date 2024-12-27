function getTheme() {
    const storedTheme = localStorage.getItem("pref-theme");
    const isDark = storedTheme === "dark" || 
        (!storedTheme && document.body.classList.contains("dark")) ||
        (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    return isDark ? "dark" : "light";
}

function updateEmbedTheme() {
    const embed = document.getElementById("appleEmbed");
    if (embed) {
        const currentSrc = new URL(embed.src);
        currentSrc.searchParams.set("theme", getTheme());
        embed.src = currentSrc.toString();
    }
}

// Update theme when page loads
document.addEventListener("DOMContentLoaded", updateEmbedTheme);

// Update theme when theme toggle is clicked
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        setTimeout(updateEmbedTheme, 0);
    });
}