import React, { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";
import {
  LayoutDashboard,
  Coins,
  Heart,
  Settings,
  User,
  LogOut,
} from "lucide-react";

const Sidebar = ({ isCollapsed = false }) => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const navigationItems = useMemo(
    () => [
      {
        to: "/",
        icon: LayoutDashboard,
        label: "Dashboard",
        end: true,
      },
      {
        to: "/collection",
        icon: Coins,
        label: "Collection",
      },
      {
        to: "/wishlist",
        icon: Heart,
        label: "Wishlist",
      },
      {
        to: "/profile",
        icon: User,
        label: "Profile",
      },
      {
        to: "/settings",
        icon: Settings,
        label: "Settings",
      },
    ],
    []
  );

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const UserAvatar = () => (
    <div className="sidebar-user-avatar">
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.nickname || "User"}
          className="avatar-image"
        />
      ) : (
        <User size={isCollapsed ? 20 : 24} />
      )}
    </div>
  );

  const NavigationItem = ({ item }) => {
    const Icon = item.icon;
    return (
      <li className="sidebar-nav-item">
        <NavLink
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `sidebar-nav-link ${isActive ? "active" : ""}`
          }
          title={isCollapsed ? item.label : undefined}
        >
          <Icon size={18} className="nav-icon" />
          {!isCollapsed && <span className="nav-text">{item.label}</span>}
        </NavLink>
      </li>
    );
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">{isCollapsed ? "D" : "DOMUS"}</div>
        {!isCollapsed && <p className="sidebar-subtitle">Aurum potestas est</p>}
      </div>

      {/* User Section */}
      <div className="sidebar-user">
        <UserAvatar />
        {!isCollapsed && (
          <div className="sidebar-user-info">
            <h4 className="user-name">{user?.nickname || "User"}</h4>
            <p className="user-rank">{user?.rank || "Novice"}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="sidebar-nav-list">
          {navigationItems.map((item, index) => (
            <NavigationItem key={index} item={item} />
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut size={18} className="logout-icon" />
          {!isCollapsed && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
