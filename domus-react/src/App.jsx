import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { useEffect } from 'react';
import { initAuthStateChangeListener } from './services/supabase';
import { Loader } from 'lucide-react';
import './App.css';

// Імпорт компонентів
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Collection from './pages/Collection';
import Wishlist from './pages/Wishlist';
import Settings from './pages/Settings';
import CreateProfile from './pages/CreateProfile';
import CheckProfile from './pages/CheckProfile';

// Рендер захищених маршрутів, які потребують авторизації
function PrivateRoute({ children }) {
  const { user, loading } = useUser();
  
  // Поки завантажуються дані, показуємо завантаження
  if (loading) {
    return (
      <div className="loading-container">
        <Loader className="animate-spin" size={48} />
        <p>Loading...</p>
      </div>
    );
  }
  
  // Якщо користувач не авторизований, перенаправляємо на сторінку входу
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppContent() {
  const { loading } = useUser();
  
  useEffect(() => {
    // Ініціалізуємо прослуховувач зміни стану авторизації
    initAuthStateChangeListener();
  }, []);
  
  if (loading) {
    return (
      <div className="loading-container">
        <Loader className="animate-spin" size={48} />
        <p>Loading application...</p>
      </div>
    );
  }
  
  return (
    <Layout>
      <Routes>
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/collection" 
          element={
            <PrivateRoute>
              <Collection />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/wishlist" 
          element={
            <PrivateRoute>
              <Wishlist />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />
        <Route path="/check-profile" element={<CheckProfile />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        
        {/* Маршрут за замовчуванням */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
}

export default App
