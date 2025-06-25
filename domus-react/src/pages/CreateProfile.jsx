import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import "../styles/domus.css";

function CreateProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: "",
    nickname: "",
    bio: "",
    location: "",
    interests: "",
    collectorType: "beginner",
  });

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle avatar selection
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 2 * 1024 * 1024) {
        setError("File size too large. Please choose an image under 2MB.");
        return;
      }

      setAvatar(file);
      setError("");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user found. Please login first.");
      }

      // Handle avatar upload if provided
      let avatarUrl = null;

      if (avatar) {
        const fileName = `${user.id}-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatar);

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        // Get the public URL for the uploaded file
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Create profile object
      const profileData = {
        id: user.id,
        displayName: formData.displayName,
        nickname: formData.nickname,
        bio: formData.bio || null,
        location: formData.location || null,
        interests: formData.interests
          ? formData.interests.split(",").map((i) => i.trim())
          : [],
        collectorType: formData.collectorType,
        avatar: avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          dateFormat: "dd/mm/yyyy",
          language: "english",
          timezone: "UTC",
          emailNotifications: true,
          publicProfile: true,
          showCollection: true,
          showWishlist: false,
          showAcquisitions: true,
        },
      };

      // Insert the profile into the database
      const { error: insertError } = await supabase
        .from("profiles")
        .insert(profileData);

      if (insertError) {
        throw new Error(`Profile creation failed: ${insertError.message}`);
      }

      // Create initial collections
      await supabase.from("collections").insert({
        user_id: user.id,
        name: "My First Collection",
        description: "Your first Roman coin collection",
        is_default: true,
        created_at: new Date(),
      });

      // Redirect to dashboard after successful profile creation
      navigate("/");
    } catch (error) {
      console.error("Error creating profile:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Go to next step
  const nextStep = () => {
    setStep(step + 1);
  };

  // Go to previous step
  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="create-profile-container">
      <div className="create-profile-header">
        <h1>Create Your Roman Identity</h1>
        <p>
          Welcome to Imperium Roma. Let's set up your profile in the ancient
          world.
        </p>
      </div>

      <div className="create-profile-progress">
        <div className={`progress-step ${step >= 1 ? "active" : ""}`}>
          <div className="step-indicator">1</div>
          <span>Basic Info</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 2 ? "active" : ""}`}>
          <div className="step-indicator">2</div>
          <span>Profile Image</span>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${step >= 3 ? "active" : ""}`}>
          <div className="step-indicator">3</div>
          <span>Collector Profile</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="create-profile-form">
        {step === 1 && (
          <div className="form-step">
            <h2>Basic Information</h2>
            <p>Tell us who you are in the modern world.</p>

            <div className="form-group">
              <label htmlFor="displayName">
                Display Name<span className="required">*</span>
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                placeholder="Your real name or preferred display name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="nickname">
                Roman Nickname<span className="required">*</span>
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                value={formData.nickname}
                onChange={handleChange}
                required
                placeholder="Your Roman alias (e.g., Aurelius, Livia)"
              />
              <small>Choose a name inspired by ancient Rome</small>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>

            <div className="step-navigation">
              <button
                type="button"
                className="btn-next"
                onClick={nextStep}
                disabled={!formData.displayName || !formData.nickname}
              >
                Next <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>Profile Image</h2>
            <p>Choose an image to represent yourself in the empire.</p>

            <div className="avatar-upload-section">
              <div className="avatar-preview">
                {avatar ? (
                  <img
                    src={URL.createObjectURL(avatar)}
                    alt="Profile preview"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <i className="fas fa-user"></i>
                  </div>
                )}
              </div>

              <div className="avatar-upload-controls">
                <label htmlFor="avatar-input" className="btn-upload">
                  <i className="fas fa-cloud-upload-alt"></i> Choose Image
                </label>
                <input
                  type="file"
                  id="avatar-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />

                {avatar && (
                  <button
                    type="button"
                    className="btn-remove-avatar"
                    onClick={() => setAvatar(null)}
                  >
                    <i className="fas fa-times"></i> Remove
                  </button>
                )}

                <div className="avatar-tips">
                  <p>Recommended: Square image, at least 200x200px</p>
                  <p>Maximum size: 2MB</p>
                </div>
              </div>
            </div>

            <div className="step-navigation">
              <button type="button" className="btn-prev" onClick={prevStep}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button type="button" className="btn-next" onClick={nextStep}>
                Next <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2>Collector Profile</h2>
            <p>Tell us about your numismatic interests.</p>

            <div className="form-group">
              <label htmlFor="bio">About You</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Share a bit about yourself and your interest in Roman coins..."
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="interests">Collecting Interests</label>
              <input
                type="text"
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                placeholder="e.g., Republican coins, Augustus, Severan dynasty"
              />
              <small>Separate multiple interests with commas</small>
            </div>

            <div className="form-group">
              <label>Collector Type</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="collectorType"
                    value="beginner"
                    checked={formData.collectorType === "beginner"}
                    onChange={handleChange}
                  />
                  <span>Beginner</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="collectorType"
                    value="intermediate"
                    checked={formData.collectorType === "intermediate"}
                    onChange={handleChange}
                  />
                  <span>Intermediate</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="collectorType"
                    value="advanced"
                    checked={formData.collectorType === "advanced"}
                    onChange={handleChange}
                  />
                  <span>Advanced</span>
                </label>
              </div>
            </div>

            <div className="step-navigation">
              <button type="button" className="btn-prev" onClick={prevStep}>
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner-small"></div> Creating Profile...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i> Create Profile
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="roman-decoration">
        <div className="column left"></div>
        <div className="column right"></div>
      </div>
    </div>
  );
}

export default CreateProfile;
