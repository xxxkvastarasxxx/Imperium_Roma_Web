import { useEffect, useState, useRef } from "react";
import { useUser } from "../contexts/UserContext";
import {
  Loader,
  Coins,
  Award,
  Heart,
  CalendarDays,
  Scale,
  History,
  BarChart2,
  PieChart,
  UserCircle,
  Star,
  DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Chart } from "chart.js/auto";
import {
  Card,
  StatCard,
  Table,
  Button,
  ChartPlaceholder,
  ProfileCard,
} from "../components/ui";

export default function Dashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const eraChartRef = useRef(null);
  const materialChartRef = useRef(null);

  const [stats, setStats] = useState({
    totalCoins: 0,
    collectionValue: "0",
    rarestItem: "None",
    oldestCoin: "None",
    wishlistCount: 0,
    rankProgress: 0,
  });

  const [chartData, setChartData] = useState({
    era: {
      labels: [],
      datasets: [
        {
          label: "Coins by Era",
          data: [],
          backgroundColor: [],
        },
      ],
    },
    material: {
      labels: [],
      datasets: [
        {
          label: "Coins by Material",
          data: [],
          backgroundColor: [],
        },
      ],
    },
  });

  const [recentAcquisitions, setRecentAcquisitions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Симулюємо завантаження даних для дашборду
    const loadDashboardData = async () => {
      try {
        // Імітація запиту до API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Статистика
        setStats({
          totalCoins: 42,
          collectionValue: "12,450 €",
          rarestItem: "Hadrian Aureus",
          oldestCoin: "Roman Republic, 211 BC",
          wishlistCount: 7,
          rankProgress: 65,
        });

        // Дані для графіка
        setChartData({
          era: {
            labels: ["Republic", "Empire", "Byzantine", "Other"],
            datasets: [
              {
                label: "Coins by Era",
                data: [10, 25, 5, 2],
                backgroundColor: [
                  "rgba(255, 204, 0, 0.8)",
                  "rgba(255, 159, 64, 0.8)",
                  "rgba(153, 102, 255, 0.8)",
                  "rgba(201, 203, 207, 0.8)",
                ],
              },
            ],
          },
          material: {
            labels: ["Gold", "Silver", "Bronze", "Other"],
            datasets: [
              {
                label: "Coins by Material",
                data: [5, 15, 20, 2],
                backgroundColor: [
                  "rgba(255, 204, 0, 0.8)",
                  "rgba(228, 228, 228, 0.8)",
                  "rgba(205, 127, 50, 0.8)",
                  "rgba(201, 203, 207, 0.8)",
                ],
              },
            ],
          },
        });

        // Останні покупки
        setRecentAcquisitions([
          {
            id: 1,
            name: "Trajan Denarius",
            image: "/assets/images/FeaturedCoinsOTD/den1.png",
            emperor: "Trajan",
            period: "98-117 AD",
            acquired: "2023-06-15",
            value: "320 €",
          },
          {
            id: 2,
            name: "Constantine Follis",
            image: "/assets/images/FeaturedCoinsOTD/08.07.24.2.jpg",
            emperor: "Constantine I",
            period: "307-337 AD",
            acquired: "2023-06-01",
            value: "85 €",
          },
          {
            id: 3,
            name: "Hadrian Sestertius",
            image: "/assets/images/FeaturedCoinsOTD/den2.png",
            emperor: "Hadrian",
            period: "117-138 AD",
            acquired: "2023-05-28",
            value: "450 €",
          },
        ]);

        // Дії користувача
        setActivities([
          {
            type: "purchase",
            message: "You purchased Hadrian Sestertius",
            date: "2023-05-28",
          },
          {
            type: "authentication",
            message: "Your Constantine Follis was authenticated",
            date: "2023-06-01",
          },
          {
            type: "wishlist",
            message: "Added Marcus Aurelius Denarius to wishlist",
            date: "2023-06-10",
          },
        ]);

        // Завантаження завершено
        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Функція для форматування дат
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Збереження екземплярів графіків у реф
  const chartInstances = useRef({
    era: null,
    material: null,
  });

  // Ініціалізація графіків після завантаження даних
  useEffect(() => {
    if (loading) return;

    // Знищуємо попередні графіки, якщо вони існують
    if (chartInstances.current.era) {
      chartInstances.current.era.destroy();
      chartInstances.current.era = null;
    }

    if (chartInstances.current.material) {
      chartInstances.current.material.destroy();
      chartInstances.current.material = null;
    }

    // Використовуємо setTimeout для забезпечення повного очищення DOM перед створенням нових графіків
    setTimeout(() => {
      // Створюємо графік для розподілу по епохах
      if (eraChartRef.current && chartData.era?.labels?.length > 0) {
        const ctx = eraChartRef.current.getContext("2d");
        chartInstances.current.era = new Chart(ctx, {
          type: "pie",
          data: chartData.era,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
                labels: {
                  color: "#aaa",
                },
              },
            },
          },
        });
      }

      // Створюємо графік для розподілу за матеріалом
      if (materialChartRef.current && chartData.material?.labels?.length > 0) {
        const ctx = materialChartRef.current.getContext("2d");
        chartInstances.current.material = new Chart(ctx, {
          type: "pie",
          data: chartData.material,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
                labels: {
                  color: "#aaa",
                },
              },
            },
          },
        });
      }
    }, 0);

    // Очищення при розмонтуванні
    return () => {
      if (chartInstances.current.era) {
        chartInstances.current.era.destroy();
        chartInstances.current.era = null;
      }
      if (chartInstances.current.material) {
        chartInstances.current.material.destroy();
        chartInstances.current.material = null;
      }
    };
  }, [loading, chartData]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader className="animate-spin" size={48} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="header-title">
        <h1>Welcome back, {user.nickname}</h1>
        <p className="date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="dashboard-overview">
        <StatCard
          icon={<Coins size={22} />}
          title="Total Items"
          value={stats.totalCoins.toString()}
          trendDirection="up"
          trendValue="12%"
          subtitle="Last 30 days"
        />

        <StatCard
          icon={<DollarSign size={22} />}
          title="Collection Value"
          value={stats.collectionValue}
          trendDirection="up"
          trendValue="8.5%"
          subtitle="Last 30 days"
        />

        <StatCard
          icon={<Award size={22} />}
          title="Rarest Item"
          value={stats.rarestItem}
          subtitle="Rarity Index: 9.2/10"
        />

        <StatCard
          icon={<CalendarDays size={22} />}
          title="Oldest Coin"
          value={stats.oldestCoin}
          subtitle="Republican Period"
        />
      </div>

      <div className="dashboard-grid">
        <Card title="Coins by Era" icon={<PieChart />} className="chart-card">
          {!loading && chartData?.era?.labels?.length > 0 ? (
            <div className="chart-container">
              <canvas ref={eraChartRef}></canvas>
            </div>
          ) : (
            <ChartPlaceholder 
              text="No data available for era distribution" 
              icon={<PieChart size={32} />} 
            />
          )}
        </Card>

        <Card
          title="Coins by Material"
          icon={<PieChart />}
          className="chart-card"
        >
          {!loading && chartData?.material?.labels?.length > 0 ? (
            <div className="chart-container">
              <canvas ref={materialChartRef}></canvas>
            </div>
          ) : (
            <ChartPlaceholder 
              text="No data available for material distribution" 
              icon={<PieChart size={32} />} 
            />
          )}
        </Card>
      </div>

      {/* Recent Acquisitions */}
      <Card
        title="Recent Acquisitions"
        icon={<Coins size={18} />}
        subtitle="Your latest additions to your collection"
        className="recent-acquisitions"
      >
        {recentAcquisitions && recentAcquisitions.length > 0 ? (
          <Table
            columns={[
              { header: "Coin", key: "coin" },
              { header: "Emperor/Period", key: "emperor" },
              { header: "Year", key: "period" },
              { header: "Acquired", key: "acquired" },
              { header: "Value", key: "value" },
            ]}
            data={recentAcquisitions.map((acquisition) => ({
              coin: (
                <div className="coin-preview">
                  <img src={acquisition.image} alt={acquisition.name} />
                  <span>{acquisition.name}</span>
                </div>
              ),
              emperor: acquisition.emperor,
              period: acquisition.period,
              acquired: formatDate(acquisition.acquired),
              value: acquisition.value,
            }))}
            hoverable={true}
          />
        ) : (
          <div className="table-empty">No recent acquisitions to display</div>
        )}

        <div className="view-more">
          <Button
            variant="primary"
            onClick={() => console.log("View collection")}
          >
            View Full Collection
          </Button>
        </div>
      </Card>

      <Card
        title="My Profile"
        icon={<UserCircle size={18} />}
        className="profile-card"
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
  );
}
