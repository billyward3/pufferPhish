// Popup script for Chrome extension

document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = 'PufferPhish is active';
  }
});

export {};