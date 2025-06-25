import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="domus-container">
      <Sidebar />

      <div className="domus-main">
        <Header />

        <main className="domus-content">{children}</main>
      </div>
    </div>
  );
}
