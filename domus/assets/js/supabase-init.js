import { supabase } from "/assets/js/supabaseClient.js"

// Initialize auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event);
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        window.location.href = '/login';
    }
});

export async function getAuthToken() {
    try {
        // Try to get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error("Error getting session:", error);
            return null;
        }
        
        if (!session) {
            console.log("No active session found");
            return null;
        }
        
        // Return the token
        return session.access_token;
    } catch (e) {
        console.error("Exception in getAuthToken:", e);
        return null;
    }
}
