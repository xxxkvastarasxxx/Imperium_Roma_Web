import { useUser } from '../../contexts/UserContext';
import { Search, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function Header() {
  const { user, notifications = [] } = useUser();

  return (
    <header className="domus-header">
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search your collection..." 
          className="search-input" 
        />
        <button className="search-button">
          <Search size={18} />
        </button>
      </div>
      
      <div className="header-controls">
        <div className="notification-bell">
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="notification-count">
              {notifications.length}
            </span>
          )}
        </div>
        
        <div className="user-dropdown">
          <img 
            src={user?.avatar || '/assets/images/default-avatar.png'} 
            alt={user?.nickname || 'User'} 
            className="user-avatar-header"
          />
          <span className="username">{user?.nickname || 'User'}</span>
          <ChevronDown size={16} />
          
          <div className="dropdown-menu">
            <ul>
              <li><a href="/profile"><User size={16} /> Profile</a></li>
              <li><a href="/settings"><Settings size={16} /> Settings</a></li>
              <li className="divider"></li>
              <li><button className="logout-button"><LogOut size={16} /> Logout</button></li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
