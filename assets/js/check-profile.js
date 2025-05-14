import { supabase } from '/assets/js/supabaseClient.js';
import { API_BASE_URL, REDIRECT_AFTER_LOGIN } from '/assets/js/config.js';

async function checkUserProfile() {
  try {
    // 1. Обмін коду на сесію (тільки при вході через Google/email)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession();

    if (exchangeError) {
      console.warn('OAuth code exchange failed:', exchangeError.message);
    }

    console.log('Exchange Code for Session:', exchangeError);

    // 2. Очистка URL від ?code=...&type=...
    if (window.location.search.includes('code=')) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('code');
      cleanUrl.searchParams.delete('type');
      window.history.replaceState({}, document.title, cleanUrl.pathname);
    }

    // 3. Отримати поточну сесію
    const { data: { session: activeSession }, error } = await supabase.auth.getSession();

    console.log('Active Session:', activeSession);

    if (error || !activeSession) {
      document.getElementById('status').textContent = 'Not logged in. Redirecting...';
      setTimeout(() => window.location.href = '/login', 1000);
      return;
    }

    const accessToken = activeSession.access_token;
    console.log('Access Token:', accessToken);

    // 4. Запит на профіль
    const res = await fetch(`${API_BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    

    if (res.status === 404) {
      document.getElementById('status').textContent = 'No profile found. Redirecting to profile creation...';
      setTimeout(() => window.location.href = '/domus/create-profile', 1000);
    } else if (res.ok) {
      document.getElementById('status').textContent = 'Profile found. Redirecting to your Domus...';
      setTimeout(() => window.location.href = REDIRECT_AFTER_LOGIN, 1000);
    } else {
      document.getElementById('status').textContent = 'Unexpected error. Please try again later.';
    }

  } catch (err) {
    console.error('checkUserProfile error:', err);
    document.getElementById('status').textContent = 'An error occurred. Please try again.';
  }
}

checkUserProfile();
