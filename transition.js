// VOID page transition — swings the whole page in on load,
// and swings it out before navigating to another internal page.

const body = document.body;

// --- Swing in on load ---
body.classList.add('page-swing-in');

body.addEventListener('animationend', function onSwingIn(e) {
  if (e.animationName !== 'swingIn') return;
  body.classList.remove('page-swing-in');
  body.style.animation = '';
  body.style.transform = '';
  body.removeEventListener('animationend', onSwingIn);

  // Bubbles may have measured the canvas mid-transform — re-measure now
  window.dispatchEvent(new Event('resize'));
});

// --- Swing out before leaving the page ---
function isInternalNavLink(link) {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) {
    return false;
  }
  return true;
}

document.querySelectorAll('.nav-buttonHome, .nav-buttonOrder').forEach((link) => {
  if (!isInternalNavLink(link)) return;

  link.addEventListener('click', function (e) {
    const destination = this.getAttribute('href');
    e.preventDefault();

    body.classList.remove('page-swing-in');
    body.style.animation = '';
    body.style.transform = '';

    // Force reflow so the swing-out animation reliably restarts
    void body.offsetWidth;

    body.classList.add('page-swing-out');

    body.addEventListener('animationend', function onSwingOut(ev) {
      if (ev.animationName !== 'swingOut') return;
      body.removeEventListener('animationend', onSwingOut);
      window.location.href = destination;
    });
  });
});