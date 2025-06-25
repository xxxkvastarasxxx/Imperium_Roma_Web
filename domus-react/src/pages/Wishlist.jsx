import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../services/supabase';
import Layout from '../components/layout/Layout';
import '../styles/domus.css';

function Wishlist() {
  const { user } = useUser();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('wishlist')
          .select('*, coin_details(*)')
          .eq('user_id', user?.id);
          
        if (error) {
          console.error('Error fetching wishlist:', error);
          return;
        }
        
        setWishlistItems(data || []);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchWishlist();
    }
  }, [user?.id]);

  // Filter and sort the wishlist items
  const filteredItems = wishlistItems.filter(item => {
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
      case 'name':
        valueA = coinA.name || '';
        valueB = coinB.name || '';
        break;
      case 'price':
        valueA = parseFloat(a.target_price || 0);
        valueB = parseFloat(b.target_price || 0);
        break;
      case 'date':
        valueA = new Date(a.date_added || 0);
        valueB = new Date(b.date_added || 0);
        break;
      case 'priority':
      default:
        valueA = a.priority || 0;
        valueB = b.priority || 0;
        break;
    }
    
    if (sortDirection === 'asc') {
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
    setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
  };

  // Function to get priority label and class
  const getPriorityInfo = (priority) => {
    switch (priority) {
      case 1:
        return { label: 'Low', className: 'priority-low' };
      case 2:
        return { label: 'Medium', className: 'priority-medium' };
      case 3:
        return { label: 'High', className: 'priority-high' };
      default:
        return { label: 'Unset', className: 'priority-unset' };
    }
  };

  return (
    <Layout>
      <div className="wishlist-container">
        <header className="wishlist-header">
          <h1>My Wishlist</h1>
          <p>Track the coins you desire for your collection.</p>
          
          <div className="wishlist-tools">
            <div className="wishlist-search">
              <input 
                type="text" 
                placeholder="Search your wishlist..." 
                value={filter}
                onChange={handleFilterChange}
              />
              <button><i className="fas fa-search"></i></button>
            </div>
            
            <div className="wishlist-sort-options">
              <select value={sortBy} onChange={handleSortChange}>
                <option value="priority">Priority</option>
                <option value="name">Name</option>
                <option value="price">Target Price</option>
                <option value="date">Date Added</option>
              </select>
              <button onClick={toggleSortDirection}>
                <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
              </button>
              
              <button className="add-wishlist-item">
                <i className="fas fa-plus"></i> Add to Wishlist
              </button>
            </div>
          </div>
        </header>
        
        <div className="wishlist-content">
          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading your wishlist from the scrolls of Rome...</p>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="empty-wishlist">
              <i className="fas fa-scroll"></i>
              <h2>Your wishlist is empty</h2>
              <p>Add coins you desire to start building your wishlist.</p>
              <button className="add-wishlist-item">
                <i className="fas fa-plus"></i> Add First Item
              </button>
            </div>
          ) : (
            <div className="wishlist-items">
              {sortedItems.map(item => {
                const coinDetails = item.coin_details || {};
                const priorityInfo = getPriorityInfo(item.priority);
                
                return (
                  <div className="wishlist-item" key={item.id}>
                    <div className="wishlist-item-image">
                      <img 
                        src={coinDetails.image_obverse || '/assets/images/coin-placeholder.jpg'} 
                        alt={coinDetails.name || 'Desired coin'} 
                      />
                    </div>
                    
                    <div className="wishlist-item-details">
                      <h3>{coinDetails.name || 'Unnamed Coin'}</h3>
                      <p className="wishlist-emperor">{coinDetails.emperor || 'Unknown Emperor'}</p>
                      <p className="wishlist-period">{coinDetails.period || 'Unknown Period'}</p>
                      
                      {item.notes && (
                        <p className="wishlist-notes">{item.notes}</p>
                      )}
                      
                      <div className="wishlist-item-meta">
                        <span className={`priority-badge ${priorityInfo.className}`}>
                          {priorityInfo.label} Priority
                        </span>
                        
                        {item.target_price && (
                          <span className="target-price">
                            <i className="fas fa-tag"></i> Target: {item.target_price} €
                          </span>
                        )}
                        
                        <span className="date-added">
                          <i className="fas fa-calendar-alt"></i>
                          {new Date(item.date_added).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="wishlist-item-actions">
                      <button className="action-btn edit" title="Edit Wishlist Item">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="action-btn found" title="Mark as Found">
                        <i className="fas fa-check"></i>
                      </button>
                      <button className="action-btn remove" title="Remove from Wishlist">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Wishlist;
