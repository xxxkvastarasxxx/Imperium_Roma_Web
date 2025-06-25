import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import {
  LayoutDashboard,
  Coins,
  Heart,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trophy,
  BookOpen,
  Component,
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside className={`domus-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <h2>DOMUS</h2>
        <p className="latin-subtitle">Aurum potestas est</p>
        <button
          className="sidebar-toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="user-brief">
        <div className="user-avatar">
          <img
            src={user.avatar || "/assets/images/default-avatar.png"}
            alt={user.nickname || "User"}
            id="user-avatar-small"
          />
        </div>
        <div className="user-quick-info">
          <h3 id="user-nickname">{user.nickname || "User"}</h3>
          <p id="user-rank">{user.rank || "Novice"}</p>
        </div>
      </div>

      <nav className="domus-nav">
        <ul>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/collection"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Coins size={18} />
              <span>Collection</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/wishlist"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Heart size={18} />
              <span>Wishlist</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/profile"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <UserCircle size={18} />
              <span>Profile</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-link">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
