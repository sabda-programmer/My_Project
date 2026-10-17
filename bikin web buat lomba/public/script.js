function togglePassword() {
  const passwordInput = document.getElementById('password');
  const icon = document.getElementById('icon');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.src = 'foto/hide.png';
  } else {
    passwordInput.type = 'password';
    icon.src = 'foto/view.png';
  }
}

const login = document.getElementById('formLogin');

login.addEventListener("submit", function (masuk) {
  masuk.preventDefault();
  window.location.href = "platform-belajar";
});