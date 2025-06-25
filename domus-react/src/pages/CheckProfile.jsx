import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { Loader } from "lucide-react";
import "../styles/domus.css";

function CheckProfile() {
  const [status, setStatus] = useState(
    "Checking your status in the Roman Empire..."
  );
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectTo, setRedirectTo] = useState("");

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setStatus("Authentication error. Please log in again.");
          setRedirectTo("/login");
          setTimeout(() => setShouldRedirect(true), 2000);
          return;
        }

        if (!session) {
          setStatus("No active session found. Redirecting to login...");
          setRedirectTo("/login");
          setTimeout(() => setShouldRedirect(true), 2000);
          return;
        }

        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile fetch error:", profileError);
          setStatus(
            "Error retrieving profile. Redirecting to profile creation..."
          );
          setRedirectTo("/create-profile");
          setTimeout(() => setShouldRedirect(true), 2000);
          return;
        }

        if (!profile) {
          setStatus("Creating your profile for the first time...");
          setRedirectTo("/create-profile");
          setTimeout(() => setShouldRedirect(true), 2000);
          return;
        }

        // If we have a profile, redirect to the dashboard
        setStatus(
          "Welcome back to the Roman Empire! Redirecting to your Domus..."
        );
        setRedirectTo("/");
        setTimeout(() => setShouldRedirect(true), 2000);
      } catch (error) {
        console.error("Unexpected error:", error);
        setStatus("An unexpected error occurred. Please try again later.");
        setRedirectTo("/login");
        setTimeout(() => setShouldRedirect(true), 2000);
      }
    };

    checkUserProfile();
  }, []);

  if (shouldRedirect) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="check-profile-container">
      <div className="check-profile-content">
        <div className="roman-spinner">
          <Loader className="animate-spin" size={48} />
        </div>
        <p id="status">{status}</p>
      </div>
    </div>
  );
}

export default CheckProfile;
