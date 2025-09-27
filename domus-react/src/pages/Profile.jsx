import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { UserCircle, Settings } from "lucide-react";
import { Card, ProfileCard, LoadingOverlay } from "../components/ui";
import "../styles/enhanced-pages.css";

export default function Profile() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalCoins: 0,
    wishlistCount: 0,
  });

  useEffect(() => {
    const loadProfileData = async () => {
      setLoading(true);

      // Імітація завантаження даних профілю
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStats({
        totalCoins: 147,
        wishlistCount: 23,
      });

      setLoading(false);
    };

    loadProfileData();
  }, []);

  return (
    <div className="dashboard-container">
      <LoadingOverlay
        isVisible={loading}
        message="Loading profile data..."
        fullScreen={true}
      />

      <div className="header-title">
        <h1>My Profile</h1>
        <p className="date">Manage your account and collection preferences</p>
      </div>

      <div className="profile-container">
        <Card
          title="Profile Information"
          icon={<UserCircle size={18} />}
          className="profile-card"
          noPadding={true}
        >
          <ProfileCard
            avatar={user.avatar || "/assets/emperor.svg"}
            name={user.nickname}
            rank="Gold Collector"
            stats={[
              { label: "Collection Items", value: stats.totalCoins },
              { label: "Wishlist", value: stats.wishlistCount },
            ]}
            actions={[
              {
                label: "Edit Profile",
                onClick: () => console.log("Edit profile"),
                variant: "primary",
              },
              {
                label: "Settings",
                onClick: () => (window.location.href = "/settings"),
                variant: "outline",
                icon: <Settings size={16} />,
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
