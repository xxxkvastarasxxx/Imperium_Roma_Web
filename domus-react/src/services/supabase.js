import { createClient } from '@supabase/supabase-js';

// Ініціалізація Supabase клієнта
const supabaseUrl = 'https://lenbsbwhyawaxqxugtjm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbmJzYndoeWF3YXhxeHVndGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzM4NjUsImV4cCI6MjA2MjgwOTg2NX0.PHvA1ZDOW6cAqvRUC_m5QoWDItuDElx4OgRn-drsA3c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Функція для отримання токену авторизації
export async function getAuthToken() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Error getting session:", error);
      return null;
    }
    
    if (!session) {
      console.log("No active session found");
      return null;
    }
    
    return session.access_token;
  } catch (e) {
    console.error("Exception in getAuthToken:", e);
    return null;
  }
}

// Перенаправлення на сторінку входу, якщо користувач не авторизований
export function initAuthStateChangeListener() {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event);
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      window.location.href = '/login';
    }
  });
}
