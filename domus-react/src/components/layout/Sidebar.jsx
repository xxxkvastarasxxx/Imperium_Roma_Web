import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { LayoutDashboard, Coins, Heart, Settings, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  return (
    <aside className={`domus-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
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
            src={user.avatar || '/assets/images/default-avatar.png'} 
            alt={user.nickname || 'User'} 
            id="user-avatar-small"
          />
        </div>
        <div className="user-quick-info">
          <h3 id="user-nickname">{user.nickname || 'User'}</h3>
          <p id="user-rank">{user.rank || 'Novice'}</p>
        </div>
      </div>
      
      <nav className="domus-nav">
        <ul>
          <li>
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/collection" className={({ isActive }) => isActive ? 'active' : ''}>
              <Coins size={18} />
              <span>Collection</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/wishlist" className={({ isActive }) => isActive ? 'active' : ''}>
              <Heart size={18} />
              <span>Wishlist</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <p>Imperium Roma &copy; {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}
