import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Функція для отримання токену авторизації
export async function getAuthToken() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

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
    if (event === "SIGNED_OUT" || event === "USER_DELETED") {
      window.location.href = "/login";
    }
  });
}
