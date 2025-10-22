
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const loginBtn = loginForm.querySelector('.login-btn');

            loginBtn.disabled = true;
            loginBtn.textContent = 'جاري التحقق...';
            errorMessage.style.display = 'none';

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed in 
                    const user = userCredential.user;
                    console.log('Login successful for:', user.email);
                    // Redirect to the admin panel
                    window.location.href = '/admin.html';
                })
                .catch((error) => {
                    const errorCode = error.code;
                    let friendlyMessage = 'حدث خطأ غير معروف.';

                    if (errorCode === 'auth/wrong-password') {
                        friendlyMessage = 'كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.';
                    } else if (errorCode === 'auth/user-not-found') {
                        friendlyMessage = 'هذا البريد الإلكتروني غير مسجل.';
                    } else if (errorCode === 'auth/invalid-email') {
                        friendlyMessage = 'صيغة البريد الإلكتروني غير صحيحة.';
                    }
                    
                    errorMessage.textContent = friendlyMessage;
                    errorMessage.style.display = 'block';

                    loginBtn.disabled = false;
                    loginBtn.textContent = 'تسجيل الدخول';
                });
        });
    }
});
