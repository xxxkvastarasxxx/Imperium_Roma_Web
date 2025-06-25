import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabase";

// Створюємо контекст для користувача
const UserContext = createContext();

export function UserProvider({ children }) {
  // Створюємо тестового користувача для розробки
  const developerModeUser = {
    id: "dev-user-id",
    nickname: "Marcus Aurelius",
    avatar: "/assets/images/general/Marcus.jpg",
    rank: "Emperor",
    title: "Imperial Collector",
    joinDate: "2024-01-15",
    level: "Advanced",
    reputation: "Excellent",
    badges: [
      { icon: "🏅", text: "Premium Member", title: "Premium Member Badge" },
      { icon: "⭐", text: "Top Collector", title: "Top Collector Badge" },
      { icon: "🏛️", text: "History Buff", title: "History Expert Badge" },
    ],
  };

  const [user, setUser] = useState(developerModeUser);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentAcquisitions, setRecentAcquisitions] = useState([]);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "Your auction for Trajan Denarius ends in 2 hours",
      read: false,
    },
    {
      id: 2,
      text: "New auction matching your watchlist: Constantine Follis",
      read: false,
    },
    { id: 3, text: "Price update for item in your wishlist", read: true },
  ]);

  // Завантаження даних користувача при ініціалізації
  useEffect(() => {
    async function loadUserData() {
      try {
        // Перевіряємо чи є активна сесія
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }

        if (!session) {
          console.log("No active session found");
          setLoading(false);
          return;
        }

        // Отримуємо дані користувача
        const { data: userData, error: userError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (userError) {
          console.error("Error fetching user data:", userError);
        } else if (userData) {
          setUser(userData);

          // Тут можна додати завантаження статистики та інших даних
          // наприклад: loadUserStats(userData.id);
        }
      } catch (err) {
        console.error("Exception in loadUserData:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  // Підписка на зміни в автентифікації
  useEffect(() => {
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Оновлюємо дані користувача при вході
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!error && data) {
            setUser(data);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      if (authSubscription) authSubscription.subscription.unsubscribe();
    };
  }, []);

  // Функції для завантаження додаткових даних
  async function loadUserStats(userId) {
    // Тут буде логіка завантаження статистики
  }

  // Функція для оновлення даних профіля користувача
  const updateUserProfile = async (updatedData) => {
    try {
      if (!user || !user.id) return;

      // Update the profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .update(updatedData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating user profile:", error);
        return false;
      }

      // Update local state
      setUser((prev) => ({ ...prev, ...updatedData }));
      return true;
    } catch (err) {
      console.error("Exception in updateUserProfile:", err);
      return false;
    }
  };

  // Функція для виходу з системи
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
        return false;
      }

      // В режимі розробки повертаємо developerModeUser для тестування
      setUser(developerModeUser);
      return true;
    } catch (err) {
      console.error("Exception in logout:", err);
      return false;
    }
  };

  // Значення, які будуть доступні через контекст
  const value = {
    user,
    loading,
    stats,
    recentAcquisitions,
    notifications,
    setUser,
    setStats,
    setRecentAcquisitions,
    setNotifications,
    updateUserProfile,
    logout,
    // Додаткові функції можна додавати тут
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Хук для використання контексту
export function useUser() {
  return useContext(UserContext);
}
