const API = 'http://localhost:5000/api';

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const alert = document.getElementById('alert');

  // Validation
  if (!email || !password) {
    showAlert('Please fill in all fields', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      // Save token and user to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } else {
      showAlert(data.message, 'error');
    }
  } catch (err) {
    showAlert('Something went wrong. Try again.', 'error');
  }
}

function showAlert(message, type) {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = `alert alert-${type}`;
  alert.style.display = 'block';
}

// Allow Enter key to login
document.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});