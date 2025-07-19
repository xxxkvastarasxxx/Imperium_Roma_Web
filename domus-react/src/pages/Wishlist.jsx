import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { supabase } from "../services/supabase";
import {
  Heart,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  ShoppingCart,
  Trash2,
  Plus,
  Loader,
  DollarSign,
  Calendar,
  Star,
} from "lucide-react";
import { Card, Button, StatCard } from "../components/ui";
import "../styles/domus.css";
import "../styles/enhanced-pages.css";

function Wishlist() {
  const { user } = useUser();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [sortDirection, setSortDirection] = useState("desc");

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("wishlist")
          .select("*, coin_details(*)")
          .eq("user_id", user?.id);

        if (error) {
          console.error("Error fetching wishlist:", error);
          return;
        }

        setWishlistItems(data || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchWishlist();
    }
  }, [user?.id]);

  // Filter and sort the wishlist items
  const filteredItems = wishlistItems.filter((item) => {
    if (!filter) return true;

    const searchTerm = filter.toLowerCase();
    const coinDetails = item.coin_details || {};

    return (
      coinDetails.name?.toLowerCase().includes(searchTerm) ||
      coinDetails.emperor?.toLowerCase().includes(searchTerm) ||
      coinDetails.period?.toLowerCase().includes(searchTerm) ||
      item.notes?.toLowerCase().includes(searchTerm)
    );
  });

  // Sort the filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const coinA = a.coin_details || {};
    const coinB = b.coin_details || {};

    let valueA, valueB;

    switch (sortBy) {
      case "name":
        valueA = coinA.name || "";
        valueB = coinB.name || "";
        break;
      case "price":
        valueA = parseFloat(a.target_price || 0);
        valueB = parseFloat(b.target_price || 0);
        break;
      case "date":
        valueA = new Date(a.date_added || 0);
        valueB = new Date(b.date_added || 0);
        break;
      case "priority":
      default:
        valueA = a.priority || 0;
        valueB = b.priority || 0;
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

  // Function to get priority label and class
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 1:
        return { label: "Low", className: "priority-low" };
      case 2:
        return { label: "Medium", className: "priority-medium" };
      case 3:
        return { label: "High", className: "priority-high" };
      default:
        return { label: "Unset", className: "priority-unset" };
    }
  };

  return (
    <div className="dashboard-container">
      <div className="header-title">
        <h1>My Wishlist</h1>
        <p className="date">Track the coins you desire for your collection</p>
      </div>

      {/* Wishlist Stats */}
      <div className="dashboard-overview">
        <StatCard
          icon={<Heart size={22} />}
          title="Wishlist Items"
          value={wishlistItems.length.toString()}
          trendDirection="up"
          trendValue="3%"
          subtitle="Last 30 days"
        />

        <StatCard
          icon={<DollarSign size={22} />}
          title="Target Budget"
          value={`${wishlistItems.reduce((sum, item) => sum + parseFloat(item.target_price || 0), 0).toFixed(0)} €`}
          subtitle="Total target prices"
        />

        <StatCard
          icon={<Star size={22} />}
          title="High Priority"
          value={wishlistItems.filter(item => item.priority === 3).length.toString()}
          subtitle="Important items"
        />
      </div>

      {/* Wishlist Tools */}
      <Card
        title="Wishlist Tools"
        icon={<Filter size={18} />}
        className="wishlist-tools-card"
      >
        <div className="collection-tools">
          <div className="collection-search">
            <div className="search-input-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search your wishlist..."
                value={filter}
                onChange={handleFilterChange}
                className="search-input"
              />
            </div>
          </div>

          <div className="collection-controls">
            <div className="sort-controls">
              <select value={sortBy} onChange={handleSortChange} className="sort-select">
                <option value="priority">Priority</option>
                <option value="name">Name</option>
                <option value="price">Target Price</option>
                <option value="date">Date Added</option>
              </select>
              <Button
                variant="outline"
                onClick={toggleSortDirection}
                className="sort-direction-btn"
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            <Button variant="primary" className="add-wishlist-btn">
              <Plus size={16} />
              Add to Wishlist
            </Button>
          </div>
        </div>
      </Card>

      {/* Wishlist Content */}
      <Card
        title="Wishlist Items"
        icon={<Heart size={18} />}
        subtitle={`${sortedItems.length} coins on your wishlist`}
        className="wishlist-content-card"
        noPadding={true}
      >
        {loading ? (
          <div className="dashboard-loading">
            <Loader className="animate-spin" size={48} />
            <p>Loading your wishlist from the scrolls of Rome...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="empty-state">
            <Heart size={64} className="empty-state-icon" />
            <h3>Your wishlist is empty</h3>
            <p>Add coins you desire to start building your wishlist.</p>
            <Button variant="primary" className="add-wishlist-btn">
              <Plus size={16} />
              Add First Item
            </Button>
          </div>
        ) : (
          <div className="wishlist-items grid-view">
            {sortedItems.map((item) => {
              const coinDetails = item.coin_details || {};
              const priorityInfo = getPriorityInfo(item.priority);

              return (
                <div className="coin-item-card wishlist-item-card" key={item.id}>
                  <div className="coin-images">
                    <img
                      src={
                        coinDetails.image_obverse ||
                        "/assets/images/coin-placeholder.jpg"
                      }
                      alt={coinDetails.name || "Desired coin"}
                      className="coin-image"
                    />
                    <div className={`priority-indicator ${priorityInfo.className}`}>
                      <Star size={14} />
                    </div>
                  </div>

                  <div className="coin-details">
                    <h3>{coinDetails.name || "Unnamed Coin"}</h3>
                    <p className="coin-emperor">
                      {coinDetails.emperor || "Unknown Emperor"}
                    </p>
                    <p className="coin-period">
                      {coinDetails.period || "Unknown Period"}
                    </p>

                    {item.notes && (
                      <p className="coin-notes">{item.notes}</p>
                    )}

                    <div className="coin-meta">
                      <span className={`priority-badge ${priorityInfo.className}`}>
                        {priorityInfo.label} Priority
                      </span>

                      {item.target_price && (
                        <span className="target-price">
                          <DollarSign size={14} />
                          Target: {item.target_price} €
                        </span>
                      )}

                      <span className="coin-date-added">
                        <Calendar size={14} />
                        {new Date(item.date_added).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="coin-actions">
                    <Button variant="outline" size="sm" title="View Details">
                      <Eye size={16} />
                    </Button>
                    <Button variant="outline" size="sm" title="Mark as Found" className="success">
                      <ShoppingCart size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      title="Remove from Wishlist"
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

export default Wishlist;
