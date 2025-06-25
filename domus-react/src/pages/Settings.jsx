import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../services/supabase';
import Layout from '../components/layout/Layout';
import '../styles/domus.css';

function Settings() {
  const { user, updateUserProfile } = useUser();
  
  const [formData, setFormData] = useState({
    displayName: '',
    nickname: '',
    email: '',
    bio: '',
    location: '',
    dateFormat: 'dd/mm/yyyy',
    language: 'english',
    timezone: 'UTC',
    emailNotifications: true,
    publicProfile: true,
    showCollection: true,
    showWishlist: false,
    showAcquisitions: true
  });
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [avatar, setAvatar] = useState(null);
  
  // Initialize form data from user context
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        nickname: user.nickname || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        dateFormat: user.preferences?.dateFormat || 'dd/mm/yyyy',
        language: user.preferences?.language || 'english',
        timezone: user.preferences?.timezone || 'UTC',
        emailNotifications: user.preferences?.emailNotifications ?? true,
        publicProfile: user.preferences?.publicProfile ?? true,
        showCollection: user.preferences?.showCollection ?? true,
        showWishlist: user.preferences?.showWishlist ?? false,
        showAcquisitions: user.preferences?.showAcquisitions ?? true
      });
    }
  }, [user]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle avatar change
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ 
          type: 'error', 
          text: 'File size too large. Please choose an image under 2MB.' 
        });
        return;
      }
      
      setAvatar(file);
      setMessage({ type: 'info', text: 'Avatar selected. Save changes to update.' });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Handle avatar upload first if there's a new avatar
      let avatarUrl = user?.avatar;
      
      if (avatar) {
        const fileName = `${user.id}-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar);
          
        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        avatarUrl = publicUrl;
      }
      
      // Create the updated profile data
      const updatedProfile = {
        displayName: formData.displayName,
        nickname: formData.nickname,
        bio: formData.bio,
        location: formData.location,
        avatar: avatarUrl,
        preferences: {
          dateFormat: formData.dateFormat,
          language: formData.language,
          timezone: formData.timezone,
          emailNotifications: formData.emailNotifications,
          publicProfile: formData.publicProfile,
          showCollection: formData.showCollection,
          showWishlist: formData.showWishlist,
          showAcquisitions: formData.showAcquisitions
        }
      };
      
      // Update email if it has changed (requires additional authentication)
      if (user.email !== formData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });
        
        if (emailError) {
          throw new Error(`Email update failed: ${emailError.message}`);
        }
        
        setMessage({ 
          type: 'info', 
          text: 'A confirmation email has been sent to your new address. Please confirm to complete the email change.' 
        });
      }
      
      // Update the user profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);
        
      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }
      
      // Update local user context
      updateUserProfile({ ...user, ...updatedProfile });
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="settings-container">
        <header className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your profile and preferences</p>
        </header>
        
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
            {message.type === 'success' && <i className="fas fa-check-circle"></i>}
            {message.type === 'info' && <i className="fas fa-info-circle"></i>}
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        
        <div className="settings-content">
          <div className="settings-tabs">
            <button 
              className={activeTab === 'profile' ? 'active' : ''} 
              onClick={() => setActiveTab('profile')}
            >
              <i className="fas fa-user"></i> Profile
            </button>
            <button 
              className={activeTab === 'preferences' ? 'active' : ''} 
              onClick={() => setActiveTab('preferences')}
            >
              <i className="fas fa-sliders-h"></i> Preferences
            </button>
            <button 
              className={activeTab === 'privacy' ? 'active' : ''} 
              onClick={() => setActiveTab('privacy')}
            >
              <i className="fas fa-shield-alt"></i> Privacy
            </button>
            <button 
              className={activeTab === 'security' ? 'active' : ''} 
              onClick={() => setActiveTab('security')}
            >
              <i className="fas fa-lock"></i> Security
            </button>
          </div>
          
          <div className="settings-form-container">
            <form onSubmit={handleSubmit} className="settings-form">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="settings-section">
                  <h2>Profile Information</h2>
                  
                  <div className="avatar-upload">
                    <div className="current-avatar">
                      <img 
                        src={avatar ? URL.createObjectURL(avatar) : user?.avatar || '/assets/images/default-avatar.png'} 
                        alt="Profile avatar" 
                      />
                    </div>
                    <div className="avatar-upload-controls">
                      <label htmlFor="avatar-input" className="btn-upload-avatar">
                        <i className="fas fa-camera"></i> Change Avatar
                      </label>
                      <input 
                        type="file" 
                        id="avatar-input" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        style={{ display: 'none' }} 
                      />
                      {avatar && (
                        <button 
                          type="button" 
                          className="btn-cancel-avatar" 
                          onClick={() => {
                            setAvatar(null);
                            setMessage({ type: '', text: '' });
                          }}
                        >
                          <i className="fas fa-times"></i> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="displayName">Display Name</label>
                    <input 
                      type="text" 
                      id="displayName" 
                      name="displayName" 
                      value={formData.displayName} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="nickname">Roman Nickname</label>
                    <input 
                      type="text" 
                      id="nickname" 
                      name="nickname" 
                      value={formData.nickname} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea 
                      id="bio" 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleChange} 
                      rows="4"
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input 
                      type="text" 
                      id="location" 
                      name="location" 
                      value={formData.location} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>
              )}
              
              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="settings-section">
                  <h2>Display & Notification Preferences</h2>
                  
                  <div className="form-group">
                    <label htmlFor="dateFormat">Date Format</label>
                    <select 
                      id="dateFormat" 
                      name="dateFormat" 
                      value={formData.dateFormat} 
                      onChange={handleChange}
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
                      onChange={handleChange}
                    >
                      <option value="english">English</option>
                      <option value="latin">Latin</option>
                      <option value="italian">Italian</option>
                      <option value="french">French</option>
                      <option value="german">German</option>
                      <option value="spanish">Spanish</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="timezone">Timezone</label>
                    <select 
                      id="timezone" 
                      name="timezone" 
                      value={formData.timezone} 
                      onChange={handleChange}
                    >
                      <option value="UTC">UTC</option>
                      <option value="UTC+1">Central European Time (UTC+1)</option>
                      <option value="UTC+2">Eastern European Time (UTC+2)</option>
                      <option value="UTC-5">Eastern Standard Time (UTC-5)</option>
                      <option value="UTC-8">Pacific Standard Time (UTC-8)</option>
                      <option value="UTC+9">Japan Standard Time (UTC+9)</option>
                    </select>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input 
                      type="checkbox" 
                      id="emailNotifications" 
                      name="emailNotifications" 
                      checked={formData.emailNotifications} 
                      onChange={handleChange} 
                    />
                    <label htmlFor="emailNotifications">
                      Receive Email Notifications
                    </label>
                  </div>
                </div>
              )}
              
              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="settings-section">
                  <h2>Privacy Settings</h2>
                  
                  <div className="form-group checkbox-group">
                    <input 
                      type="checkbox" 
                      id="publicProfile" 
                      name="publicProfile" 
                      checked={formData.publicProfile} 
                      onChange={handleChange} 
                    />
                    <label htmlFor="publicProfile">
                      Make my profile public
                    </label>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input 
                      type="checkbox" 
                      id="showCollection" 
                      name="showCollection" 
                      checked={formData.showCollection} 
                      onChange={handleChange} 
                    />
                    <label htmlFor="showCollection">
                      Show my collection to other collectors
                    </label>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input 
                      type="checkbox" 
                      id="showWishlist" 
                      name="showWishlist" 
                      checked={formData.showWishlist} 
                      onChange={handleChange} 
                    />
                    <label htmlFor="showWishlist">
                      Show my wishlist to other collectors
                    </label>
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <input 
                      type="checkbox" 
                      id="showAcquisitions" 
                      name="showAcquisitions" 
                      checked={formData.showAcquisitions} 
                      onChange={handleChange} 
                    />
                    <label htmlFor="showAcquisitions">
                      Show my recent acquisitions to other collectors
                    </label>
                  </div>
                  
                  <div className="data-management">
                    <h3>Data Management</h3>
                    <p>Control your personal data and account settings</p>
                    
                    <div className="data-actions">
                      <button type="button" className="btn-secondary">
                        <i className="fas fa-download"></i> Download My Data
                      </button>
                      <button type="button" className="btn-danger">
                        <i className="fas fa-trash-alt"></i> Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="settings-section">
                  <h2>Security Settings</h2>
                  
                  <div className="password-section">
                    <h3>Change Password</h3>
                    
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input type="password" id="currentPassword" name="currentPassword" />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input type="password" id="newPassword" name="newPassword" />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input type="password" id="confirmPassword" name="confirmPassword" />
                    </div>
                    
                    <button type="button" className="btn-primary">Update Password</button>
                  </div>
                  
                  <div className="sessions-section">
                    <h3>Active Sessions</h3>
                    <p>These are devices that have logged into your account</p>
                    
                    <div className="session-list">
                      <div className="session-item current">
                        <div className="session-info">
                          <i className="fas fa-desktop"></i>
                          <div>
                            <strong>Current Browser</strong>
                            <p>Last active: Now</p>
                          </div>
                        </div>
                        <span className="session-tag">Current</span>
                      </div>
                      
                      <div className="session-item">
                        <div className="session-info">
                          <i className="fas fa-mobile-alt"></i>
                          <div>
                            <strong>Mobile App</strong>
                            <p>Last active: 2 days ago</p>
                          </div>
                        </div>
                        <button className="btn-text-danger">Revoke</button>
                      </div>
                    </div>
                    
                    <button type="button" className="btn-secondary">
                      <i className="fas fa-sign-out-alt"></i> Logout from All Devices
                    </button>
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> Save Changes
                    </>
                  )}
                </button>
                <button type="button" className="btn-secondary">
                  <i className="fas fa-undo"></i> Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;
