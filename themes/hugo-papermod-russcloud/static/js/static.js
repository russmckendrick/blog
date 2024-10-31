function updateTVStatic() {
    const page404 = document.querySelector('.page-404');
    if (page404) {
      const randomOpacity = (Math.random() * 0.05 + 0.1).toFixed(2); // Random opacity between 0.1 and 0.15
      page404.style.setProperty('--static-opacity', randomOpacity);
    }
  }
  
  function initializeTVStatic() {
    const page404 = document.querySelector('.page-404');
    if (page404) {
      // Update the static effect every 500ms
      setInterval(updateTVStatic, 500);
      // Initial call to set the effect
      updateTVStatic();
    }
  }
  
  // Run the initialization when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', initializeTVStatic);