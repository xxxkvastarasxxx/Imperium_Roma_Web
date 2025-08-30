import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../services/supabase";
import {
  Coins,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
  Plus,
  Loader,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Card, Button, StatCard, LoadingOverlay } from "../components/ui";
import "../styles/domus.css";
import "../styles/enhanced-pages.css";

function Collection() {
  const { user } = useUser();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("coin_collection")
          .select("*, coin_details(*)")
          .eq("user_id", user?.id);

        if (error) {
          console.error("Error fetching collection:", error);
          return;
        }

        setCoins(data || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchCollection();
    }
  }, [user?.id]);

  // Filter and sort the coins
  const filteredCoins = coins.filter((coin) => {
    if (!filter) return true;

    const searchTerm = filter.toLowerCase();
    const coinDetails = coin.coin_details || {};

    return (
      coinDetails.name?.toLowerCase().includes(searchTerm) ||
      coinDetails.emperor?.toLowerCase().includes(searchTerm) ||
      coinDetails.period?.toLowerCase().includes(searchTerm) ||
      coinDetails.type?.toLowerCase().includes(searchTerm) ||
      coinDetails.material?.toLowerCase().includes(searchTerm)
    );
  });

  // Sort the filtered coins
  const sortedCoins = [...filteredCoins].sort((a, b) => {
    const coinA = a.coin_details || {};
    const coinB = b.coin_details || {};

    let valueA, valueB;

    switch (sortBy) {
      case "name":
        valueA = coinA.name || "";
        valueB = coinB.name || "";
        break;
      case "emperor":
        valueA = coinA.emperor || "";
        valueB = coinB.emperor || "";
        break;
      case "period":
        valueA = coinA.period || "";
        valueB = coinB.period || "";
        break;
      case "value":
        valueA = parseFloat(coinA.estimated_value || 0);
        valueB = parseFloat(coinB.estimated_value || 0);
        break;
      case "dateAdded":
      default:
        valueA = new Date(a.date_added || 0);
        valueB = new Date(b.date_added || 0);
        break;
    }

    if (sortDirection === "asc") {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  // Handle filter change
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  // Handle sort change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection((prevDirection) =>
      prevDirection === "asc" ? "desc" : "asc"
    );
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === "grid" ? "list" : "grid"));
  };

  return (
    <div className="dashboard-container">
      <LoadingOverlay 
        isVisible={loading} 
        message="Loading your collection..." 
        fullScreen={true}
      />
      
      <div className="header-title">
        <h1>My Collection</h1>
        <p className="date">Manage and view all items in your Roman numismatic collection</p>
      </div>

      {/* Collection Stats */}
      <div className="dashboard-overview">
        <StatCard
          icon={<Coins size={22} />}
          title="Total Coins"
          value={coins.length.toString()}
          trendDirection="up"
          trendValue="5%"
          subtitle="Last 30 days"
        />

        <StatCard
          icon={<DollarSign size={22} />}
          title="Collection Value"
          value={`${coins.reduce((sum, coin) => sum + parseFloat(coin.coin_details?.estimated_value || 0), 0).toFixed(0)} €`}
          trendDirection="up"
          trendValue="8.5%"
          subtitle="Estimated"
        />

        <StatCard
          icon={<Calendar size={22} />}
          title="Latest Addition"
          value={coins.length > 0 ? new Date(Math.max(...coins.map(c => new Date(c.date_added)))).toLocaleDateString() : "None"}
          subtitle="Most recent coin"
        />
      </div>

      {/* Collection Tools */}
      <Card
        title="Collection Tools"
        icon={<Filter size={18} />}
        className="collection-tools-card"
      >
        <div className="collection-tools">
          <div className="collection-search">
            <div className="search-input-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search your collection..."
                value={filter}
                onChange={handleFilterChange}
                className="search-input"
              />
            </div>
          </div>

          <div className="collection-controls">
            <div className="sort-controls">
              <select value={sortBy} onChange={handleSortChange} className="sort-select">
                <option value="dateAdded">Date Added</option>
                <option value="name">Name</option>
                <option value="emperor">Emperor</option>
                <option value="period">Period</option>
                <option value="value">Value</option>
              </select>
              <Button
                variant="outline"
                onClick={toggleSortDirection}
                className="sort-direction-btn"
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            <div className="view-controls">
              <Button
                variant={viewMode === "grid" ? "primary" : "outline"}
                onClick={() => setViewMode("grid")}
                className="view-mode-btn"
              >
                <Grid3X3 size={16} />
              </Button>
              <Button
                variant={viewMode === "list" ? "primary" : "outline"}
                onClick={() => setViewMode("list")}
                className="view-mode-btn"
              >
                <List size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Collection Content */}
      <Card
        title="Collection Items"
        icon={<Coins size={18} />}
        subtitle={`${sortedCoins.length} coins in your collection`}
        className="collection-content-card"
        noPadding={true}
      >
        {loading ? (
          <div className="dashboard-loading">
            <Loader className="animate-spin" size={48} />
            <p>Loading your treasures from the vaults of Rome...</p>
          </div>
        ) : sortedCoins.length === 0 ? (
          <div className="empty-state">
            <Coins size={64} className="empty-state-icon" />
            <h3>Your collection is empty</h3>
            <p>
              Explore the markets of Rome or add your first coin to begin your
              collection.
            </p>
            <Button variant="primary" className="add-coin-btn">
              <Plus size={16} />
              Add First Coin
            </Button>
          </div>
        ) : (
          <div className={`collection-items ${viewMode === "grid" ? "grid-view" : "list-view"}`}>
            {sortedCoins.map((coin) => {
              const coinDetails = coin.coin_details || {};
              return (
                <div className="coin-item-card" key={coin.id}>
                  <div className="coin-images">
                    <img
                      src={
                        coinDetails.image_obverse ||
                        "/assets/images/coin-placeholder.jpg"
                      }
                      alt={`Obverse of ${coinDetails.name}`}
                      className="coin-image obverse"
                    />
                    <img
                      src={
                        coinDetails.image_reverse ||
                        "/assets/images/coin-placeholder.jpg"
                      }
                      alt={`Reverse of ${coinDetails.name}`}
                      className="coin-image reverse"
                    />
                  </div>
                  <div className="coin-details">
                    <h3>{coinDetails.name || "Unknown Coin"}</h3>
                    <p className="coin-emperor">
                      {coinDetails.emperor || "Unknown Emperor"}
                    </p>
                    <p className="coin-period">
                      {coinDetails.period || "Unknown Period"}
                    </p>
                    <p className="coin-material">
                      {coinDetails.material || "Unknown Material"}
                    </p>
                    <div className="coin-meta">
                      <span className="coin-value">
                        <DollarSign size={14} />
                        {coinDetails.estimated_value
                          ? `${coinDetails.estimated_value} €`
                          : "Not valued"}
                      </span>
                      <span className="coin-date-added">
                        <Calendar size={14} />
                        {new Date(coin.date_added).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="coin-actions">
                    <Button variant="outline" size="sm" title="View Details">
                      <Eye size={16} />
                    </Button>
                    <Button variant="outline" size="sm" title="Edit Coin">
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Remove from Collection"
                      className="danger"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default Collection;
