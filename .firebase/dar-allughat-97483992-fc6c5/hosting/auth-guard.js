
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// A simple auth guard
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // No user is signed in.
    console.log('User is not logged in. Redirecting to login page.');
    // Redirect them to the login page, but not if they are already on it.
    if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
    }
  } else {
    // User is signed in.
    console.log('User is logged in:', user.email);
    // You can optionally hide a loader or show the main content now
    document.body.style.display = 'block'; // Or whatever logic you have to show content
  }
});
