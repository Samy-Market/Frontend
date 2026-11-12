// Aplica el modo claro/oscuro antes de pintar para evitar un destello blanco. Es un archivo aparte
// (no un <script> en línea) para que la Content-Security-Policy pueda prohibir scripts en línea.
(function () {
  try {
    var p = localStorage.getItem('samy.theme');
    var dark = p === 'dark' || (p !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      document.querySelector('meta[name="theme-color"]').setAttribute('content', '#000000');
    }
  } catch (e) {}
})();
