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

// Функція для безпечного видалення користувацького акаунту
export async function deleteUserAccount(userId) {
  try {
    // 1. Delete user's collection data
    const { error: collectionError } = await supabase
      .from("coin_collection")
      .delete()
      .eq("user_id", userId);

    if (collectionError) {
      console.error("Error deleting collection:", collectionError);
      throw new Error(`Failed to delete collection: ${collectionError.message}`);
    }

    // 2. Delete user's wishlist data  
    const { error: wishlistError } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", userId);

    if (wishlistError) {
      console.error("Error deleting wishlist:", wishlistError);
      throw new Error(`Failed to delete wishlist: ${wishlistError.message}`);
    }

    // 3. Delete user's profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }

    // 4. Sign out user from current session
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error("Error signing out:", signOutError);
      throw new Error(`Failed to sign out: ${signOutError.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteUserAccount:", error);
    throw error;
  }
}
