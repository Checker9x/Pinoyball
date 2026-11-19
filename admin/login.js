const ADMIN_BASE = window.location.pathname.startsWith('/admin') ? '/admin' : '';
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('current-password');
const toggleBtn = document.getElementById('toggle-password');
const submitBtn = document.getElementById('login-submit');
const errorBox = document.getElementById('login-error');

toggleBtn?.addEventListener('click', () => {
  const showing = passwordInput.type === 'text';
  passwordInput.type = showing ? 'password' : 'text';
  toggleBtn.setAttribute('aria-pressed', String(!showing));
  toggleBtn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
  toggleBtn.textContent = showing ? 'Show' : 'Hide';
});

const linkError = (el, shown) => {
  const errorId = el.dataset?.error;
  if (!errorId) return;
  const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
  else el.removeAttribute('aria-describedby');
};

const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
function syncFieldAria(el) {
  if (!el?.matches?.('input')) return;
  const invalid = supportsUserInvalid ? el.matches(':user-invalid') : el.classList.contains('user-invalid-fallback');
  el.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  linkError(el, invalid);
}

[emailInput, passwordInput].forEach(el => {
  if (!el) return;
  el.setAttribute('aria-invalid', 'false');
  el.addEventListener('blur', () => syncFieldAria(el));
  el.addEventListener('input', () => {
    errorBox.hidden = true;
    syncFieldAria(el);
  });
  el.addEventListener('invalid', () => {
    if (!supportsUserInvalid) el.classList.add('user-invalid-fallback');
    syncFieldAria(el);
  });
});

loginForm?.addEventListener('submit', async e => {
  e.preventDefault();
  errorBox.hidden = true;
  if (!loginForm.checkValidity()) {
    const firstInvalid = loginForm.querySelector(':invalid');
    firstInvalid?.focus();
    return;
  }
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing In…';
  try {
    const res = await fetch(`${ADMIN_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.ok) {
      throw new Error(payload.error || 'Invalid email or password.');
    }
    window.location.assign(ADMIN_BASE ? `${ADMIN_BASE}/` : '/');
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.hidden = false;
    passwordInput.focus();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});
