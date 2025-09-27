import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { supabase, deleteUserAccount } from "../services/supabase";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe,
  Save,
  Upload,
  Eye,
  EyeOff,
  Loader,
  Trash2,
  AlertTriangle,
  Mail,
  Lock,
} from "lucide-react";
import { Card, Button, LoadingOverlay, CustomSpinner } from "../components/ui";
import "../styles/domus.css";
import "../styles/enhanced-pages.css";

function Settings() {
  const { user, updateUserProfile } = useUser();

  const [formData, setFormData] = useState({
    displayName: "",
    nickname: "",
    email: "",
    bio: "",
    location: "",
    dateFormat: "dd/mm/yyyy",
    language: "english",
    timezone: "UTC",
    emailNotifications: true,
    publicProfile: true,
    showCollection: true,
    showWishlist: false,
    showAcquisitions: true,
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [avatar, setAvatar] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailChangeData, setEmailChangeData] = useState({
    newEmail: "",
    password: "",
    showConfirm: false,
  });
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Initialize form data from user context
  useEffect(() => {
    const loadUserSettings = async () => {
      setInitialLoading(true);

      // Імітація завантаження даних користувача
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (user) {
        setFormData({
          displayName: user.displayName || "",
          nickname: user.nickname || "",
          email: user.email || "",
          bio: user.bio || "",
          location: user.location || "",
          dateFormat: user.preferences?.dateFormat || "dd/mm/yyyy",
          language: user.preferences?.language || "english",
          timezone: user.preferences?.timezone || "UTC",
          emailNotifications: user.preferences?.emailNotifications ?? true,
          publicProfile: user.preferences?.publicProfile ?? true,
          showCollection: user.preferences?.showCollection ?? true,
          showWishlist: user.preferences?.showWishlist ?? false,
          showAcquisitions: user.preferences?.showAcquisitions ?? true,
        });
      }

      setInitialLoading(false);
    };

    loadUserSettings();
  }, [user]);

  // Handle input changes
  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
  };

  // Handle avatar file change
  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage({ type: "", text: "" });

    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select a valid image file");
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      setAvatar(file);

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setMessage({ type: "success", text: "Avatar uploaded successfully!" });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setMessage({ type: "error", text: error.message });
      setAvatar(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSavingSettings(true);
    setMessage({ type: "", text: "" });

    try {
      // Prepare data for update
      const updatedProfile = {
        display_name: formData.displayName,
        nickname: formData.nickname,
        email: formData.email,
        bio: formData.bio,
        location: formData.location,
        preferences: JSON.stringify({
          dateFormat: formData.dateFormat,
          language: formData.language,
          timezone: formData.timezone,
          emailNotifications: formData.emailNotifications,
          publicProfile: formData.publicProfile,
          showCollection: formData.showCollection,
          showWishlist: formData.showWishlist,
          showAcquisitions: formData.showAcquisitions,
        }),
        updated_at: new Date().toISOString(),
      };

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", user.id);

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      // Update local user context
      updateUserProfile({ ...user, ...updatedProfile });

      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle profile deletion
  const handleDeleteProfile = async () => {
    if (deleteConfirmText !== "DELETE") {
      setMessage({
        type: "error",
        text: "Please type 'DELETE' to confirm account deletion",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUserAccount(user.id);

      // Success message (user will be redirected)
      setMessage({
        type: "success",
        text: "Account deleted successfully. Redirecting...",
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Error deleting profile:", error);
      setMessage({ type: "error", text: error.message });
      setIsDeleting(false);
    }
  };

  // Reset delete confirmation
  const resetDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!emailChangeData.newEmail || !emailChangeData.password) {
      setMessage({
        type: "error",
        text: "Please provide both new email and current password",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailChangeData.newEmail)) {
      setMessage({
        type: "error",
        text: "Please enter a valid email address",
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      // Update email with Supabase
      const { error } = await supabase.auth.updateUser({
        email: emailChangeData.newEmail,
      });

      if (error) {
        throw new Error(error.message);
      }

      setMessage({
        type: "info",
        text: "Email change confirmation sent! Check your new email to confirm the change.",
      });

      // Reset form
      setEmailChangeData({
        newEmail: "",
        password: "",
        showConfirm: false,
      });
    } catch (error) {
      console.error("Error changing email:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Reset email change form
  const resetEmailChange = () => {
    setEmailChangeData({
      newEmail: "",
      password: "",
      showConfirm: false,
    });
  };

  return (
    <div className="settings-container">
      <LoadingOverlay
        isVisible={initialLoading}
        message="Loading account settings..."
        fullScreen={true}
      />

      <div className="header-title">
        <h1>Account Settings</h1>
        <p className="date">Manage your profile and preferences</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === "error" && <Shield className="alert-icon" />}
          {message.type === "success" && <Shield className="alert-icon" />}
          {message.type === "info" && <Shield className="alert-icon" />}
          <span>{message.text}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessage({ type: "", text: "" })}
          >
            ×
          </Button>
        </div>
      )}

      <div className="settings-tabs-container">
        <div className="settings-tabs">
          <Button
            variant={activeTab === "profile" ? "primary" : "outline"}
            onClick={() => setActiveTab("profile")}
            className="tab-button"
          >
            <User size={16} />
            Profile
          </Button>
          <Button
            variant={activeTab === "preferences" ? "primary" : "outline"}
            onClick={() => setActiveTab("preferences")}
            className="tab-button"
          >
            <SettingsIcon size={16} />
            Preferences
          </Button>
          <Button
            variant={activeTab === "privacy" ? "primary" : "outline"}
            onClick={() => setActiveTab("privacy")}
            className="tab-button"
          >
            <Shield size={16} />
            Privacy
          </Button>
          <Button
            variant={activeTab === "account" ? "primary" : "outline"}
            onClick={() => setActiveTab("account")}
            className="tab-button"
          >
            <AlertTriangle size={16} />
            Account
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === "profile" && (
          <Card
            title="Profile Information"
            icon={<User size={18} />}
            subtitle="Update your personal information"
            className="settings-card"
          >
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your display name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nickname">Nickname</label>
                <input
                  type="text"
                  id="nickname"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your nickname"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your location"
                />
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="form-textarea"
                  rows="3"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="form-group form-group-full">
                <label htmlFor="avatar">Profile Avatar</label>
                <div className="file-upload">
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="file-input"
                  />
                  <Button
                    variant="outline"
                    type="button"
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <>
                        <CustomSpinner size={16} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload Avatar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "preferences" && (
          <Card
            title="Preferences"
            icon={<SettingsIcon size={18} />}
            subtitle="Customize your experience"
            className="settings-card"
          >
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="dateFormat">Date Format</label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  value={formData.dateFormat}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                  <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="language">Language</label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="english">English</option>
                  <option value="ukrainian">Українська</option>
                  <option value="latin">Latina</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timezone">Timezone</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="UTC">UTC</option>
                  <option value="Europe/Kiev">Europe/Kiev</option>
                  <option value="Europe/Rome">Europe/Rome</option>
                </select>
              </div>

              <div className="form-group form-group-full">
                <div className="checkbox-group">
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="emailNotifications"
                      name="emailNotifications"
                      checked={formData.emailNotifications}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="emailNotifications">
                      <Bell size={16} />
                      Email Notifications
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "privacy" && (
          <Card
            title="Privacy Settings"
            icon={<Shield size={18} />}
            subtitle="Control your privacy and visibility"
            className="settings-card"
          >
            <div className="form-grid">
              <div className="form-group form-group-full">
                <div className="checkbox-group">
                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="publicProfile"
                      name="publicProfile"
                      checked={formData.publicProfile}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="publicProfile">
                      <Globe size={16} />
                      Public Profile
                    </label>
                  </div>

                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="showCollection"
                      name="showCollection"
                      checked={formData.showCollection}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="showCollection">
                      <Eye size={16} />
                      Show Collection
                    </label>
                  </div>

                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="showWishlist"
                      name="showWishlist"
                      checked={formData.showWishlist}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="showWishlist">
                      <EyeOff size={16} />
                      Show Wishlist
                    </label>
                  </div>

                  <div className="checkbox-item">
                    <input
                      type="checkbox"
                      id="showAcquisitions"
                      name="showAcquisitions"
                      checked={formData.showAcquisitions}
                      onChange={handleInputChange}
                      className="form-checkbox"
                    />
                    <label htmlFor="showAcquisitions">
                      <Eye size={16} />
                      Show Acquisitions
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === "account" && (
          <Card
            title="Account Management"
            icon={<AlertTriangle size={18} />}
            subtitle="Manage your account and data"
            className="settings-card"
          >
            <div className="form-grid">
              <div className="form-group form-group-full">
                <div className="account-section">
                  <h4>Email Management</h4>
                  <div className="current-email">
                    <label>Current Email:</label>
                    <span className="current-email-display">{user?.email}</span>
                  </div>

                  {!emailChangeData.showConfirm ? (
                    <div className="email-change-prompt">
                      <p className="email-change-info">
                        <Mail size={16} />
                        To change your email address, you'll need to verify the
                        new email. A confirmation link will be sent to your new
                        address.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setEmailChangeData({
                            ...emailChangeData,
                            showConfirm: true,
                          })
                        }
                        className="change-email-btn"
                      >
                        <Mail size={16} />
                        Change Email
                      </Button>
                    </div>
                  ) : (
                    <div className="email-change-form">
                      <div className="form-group">
                        <label htmlFor="newEmail">New Email Address</label>
                        <input
                          type="email"
                          id="newEmail"
                          value={emailChangeData.newEmail}
                          onChange={(e) =>
                            setEmailChangeData({
                              ...emailChangeData,
                              newEmail: e.target.value,
                            })
                          }
                          className="form-input"
                          placeholder="Enter your new email address"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="currentPassword">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          value={emailChangeData.password}
                          onChange={(e) =>
                            setEmailChangeData({
                              ...emailChangeData,
                              password: e.target.value,
                            })
                          }
                          className="form-input"
                          placeholder="Enter your current password"
                        />
                      </div>

                      <div className="email-change-warning">
                        <AlertTriangle size={16} />
                        <div>
                          <p>
                            <strong>Important:</strong>
                          </p>
                          <ul>
                            <li>
                              You'll receive a confirmation email at the new
                              address
                            </li>
                            <li>
                              Your current email will remain active until you
                              confirm the change
                            </li>
                            <li>
                              This process may take a few minutes to complete
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="email-change-actions">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleEmailChange}
                          disabled={
                            isChangingEmail ||
                            !emailChangeData.newEmail ||
                            !emailChangeData.password
                          }
                        >
                          {isChangingEmail ? (
                            <>
                              <CustomSpinner size={16} />
                              Sending Verification...
                            </>
                          ) : (
                            <>
                              <Mail size={16} />
                              Send Verification Email
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setEmailChangeData({
                              newEmail: "",
                              password: "",
                              showConfirm: false,
                            })
                          }
                          disabled={isChangingEmail}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group form-group-full">
                <div className="account-section">
                  <h4>Delete Account</h4>
                  <p className="account-warning">
                    <AlertTriangle size={16} />
                    This action cannot be undone. Deleting your account will
                    permanently remove:
                  </p>
                  <ul className="account-warning-list">
                    <li>Your profile and personal information</li>
                    <li>Your entire coin collection data</li>
                    <li>Your wishlist items</li>
                    <li>All historical data and preferences</li>
                  </ul>

                  {!showDeleteConfirm ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="danger delete-account-btn"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 size={16} />
                      Delete Account
                    </Button>
                  ) : (
                    <div className="delete-confirmation">
                      <p className="delete-confirm-text">
                        To confirm deletion, type <strong>DELETE</strong> in the
                        field below:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="form-input delete-confirm-input"
                        placeholder="Type DELETE to confirm"
                      />
                      <div className="delete-actions">
                        <Button
                          type="button"
                          variant="primary"
                          className="danger"
                          onClick={handleDeleteProfile}
                          disabled={
                            isDeleting || deleteConfirmText !== "DELETE"
                          }
                        >
                          {isDeleting ? (
                            <>
                              <CustomSpinner size={16} />
                              Deleting Account...
                            </>
                          ) : (
                            <>
                              <Trash2 size={16} />
                              Permanently Delete Account
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={resetDeleteConfirm}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="settings-actions">
          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={savingSettings || initialLoading}
              className="save-button"
            >
              {savingSettings ? (
                <>
                  <CustomSpinner size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              className="reset-button"
            >
              Reset
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default Settings;
