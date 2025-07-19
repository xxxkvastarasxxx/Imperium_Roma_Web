import { useUser } from "../contexts/UserContext";
import { Award, Star, UserCircle, Edit, Settings, Shield } from "lucide-react";
import { Card, ProfileCard, Button } from "../components/ui";
import { Link } from "react-router-dom";
import "../styles/enhanced-pages.css";

export default function Profile() {
  const { user } = useUser();

  const stats = {
    totalCoins: 147,
    wishlistCount: 23,
  };

  return (
    <div className="dashboard-container">
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
            badges={[
              {
                icon: <Award size={16} />,
                text: "Expert",
                title: "Expert Collector",
              },
              {
                icon: <Star size={16} />,
                text: "Verified",
                title: "Verified Account",
              },
            ]}
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
                onClick: () => window.location.href = "/settings",
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
