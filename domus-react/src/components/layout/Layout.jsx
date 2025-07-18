import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`domus-container ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar isCollapsed={isCollapsed} />

      <div className="domus-main">
        <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <main className="domus-content">{children}</main>
      </div>
    </div>
  );
}
