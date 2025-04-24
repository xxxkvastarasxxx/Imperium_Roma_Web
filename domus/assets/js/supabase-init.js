import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://nodxtpjwgyjbghpaiajo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vZHh0cGp3Z3lqYmdocGFpYWpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxODg3MjEsImV4cCI6MjA1ODc2NDcyMX0.GX3liK9iN_kcug7OFh2EZUilNzVq2GxEblhidkUBOY0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
