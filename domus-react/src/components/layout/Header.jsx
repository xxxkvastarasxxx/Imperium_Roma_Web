import { useUser } from "../../contexts/UserContext";
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export default function Header({ isCollapsed, setIsCollapsed }) {
  const { user, notifications = [] } = useUser();

  return (
    <header className="domus-header">
      <div className="header-left">
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

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
      </div>

      <div className="header-controls">
        <div className="notification-bell">
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="notification-count">{notifications.length}</span>
          )}
        </div>

        {/* Закоментовано інформацію профіля, оскільки вона дублюється з сайдбаром */}
        {/*
        <div className="user-dropdown">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user?.nickname || "User"}
              className="user-avatar-header"
            />
          ) : (
            <div className="user-avatar-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <User size={20} color="var(--primary)" />
            </div>
          )}
          <span className="username">{user?.nickname || "User"}</span>
          <ChevronDown size={16} />

          <div className="dropdown-menu">
            <ul>
              <li>
                <a href="/profile">
                  <User size={16} /> Profile
                </a>
              </li>
              <li>
                <a href="/settings">
                  <Settings size={16} /> Settings
                </a>
              </li>
              <li className="divider"></li>
              <li>
                <button className="logout-button">
                  <LogOut size={16} /> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
        */}
      </div>
    </header>
  );
}
