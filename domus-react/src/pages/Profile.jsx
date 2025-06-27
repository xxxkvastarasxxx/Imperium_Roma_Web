import { useUser } from "../contexts/UserContext";
import { Award, Star, UserCircle } from "lucide-react";
import { Card, ProfileCard } from "../components/ui";

export default function Profile() {
  const { user } = useUser();

  const stats = {
    totalCoins: 147,
    wishlistCount: 23,
  };

  return (
    <div className="profile-page">
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
            avatar={user.avatar || "/assets/images/general/marcus.png"}
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
                label: "View Public Profile",
                onClick: () => console.log("View public profile"),
                variant: "outline",
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
