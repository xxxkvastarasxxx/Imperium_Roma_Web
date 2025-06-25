import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../services/supabase';
import Layout from '../components/layout/Layout';
import '../styles/domus.css';

function Collection() {
  const { user } = useUser();
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('coin_collection')
          .select('*, coin_details(*)')
          .eq('user_id', user?.id);
          
        if (error) {
          console.error('Error fetching collection:', error);
          return;
        }
        
        setCoins(data || []);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchCollection();
    }
  }, [user?.id]);

  // Filter and sort the coins
  const filteredCoins = coins.filter(coin => {
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
      case 'name':
        valueA = coinA.name || '';
        valueB = coinB.name || '';
        break;
      case 'emperor':
        valueA = coinA.emperor || '';
        valueB = coinB.emperor || '';
        break;
      case 'period':
        valueA = coinA.period || '';
        valueB = coinB.period || '';
        break;
      case 'value':
        valueA = parseFloat(coinA.estimated_value || 0);
        valueB = parseFloat(coinB.estimated_value || 0);
        break;
      case 'dateAdded':
      default:
        valueA = new Date(a.date_added || 0);
        valueB = new Date(b.date_added || 0);
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
  
  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'grid' ? 'list' : 'grid');
  };

  return (
    <Layout>
      <div className="collection-container">
        <header className="collection-header">
          <h1>My Coin Collection</h1>
          <p>Manage and view all items in your Roman numismatic collection.</p>
          
          <div className="collection-tools">
            <div className="collection-search">
              <input 
                type="text" 
                placeholder="Search your collection..." 
                value={filter}
                onChange={handleFilterChange}
              />
              <button><i className="fas fa-search"></i></button>
            </div>
            
            <div className="collection-view-options">
              <div className="sort-controls">
                <select value={sortBy} onChange={handleSortChange}>
                  <option value="dateAdded">Date Added</option>
                  <option value="name">Name</option>
                  <option value="emperor">Emperor</option>
                  <option value="period">Period</option>
                  <option value="value">Value</option>
                </select>
                <button onClick={toggleSortDirection}>
                  <i className={`fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}></i>
                </button>
              </div>
              
              <button 
                className="view-mode-toggle" 
                onClick={toggleViewMode}
                title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
              >
                <i className={`fas fa-${viewMode === 'grid' ? 'list' : 'th'}`}></i>
              </button>
            </div>
          </div>
        </header>
        
        <div className="collection-content">
          {loading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading your treasures from the vaults of Rome...</p>
            </div>
          ) : sortedCoins.length === 0 ? (
            <div className="empty-collection">
              <i className="fas fa-scroll"></i>
              <h2>Your collection is empty</h2>
              <p>Explore the markets of Rome or add your first coin to begin your collection.</p>
              <button className="add-coin-btn">
                <i className="fas fa-plus"></i> Add First Coin
              </button>
            </div>
          ) : (
            <div className={`collection-items ${viewMode === 'grid' ? 'grid-view' : 'list-view'}`}>
              {sortedCoins.map(coin => {
                const coinDetails = coin.coin_details || {};
                return (
                  <div className="coin-item" key={coin.id}>
                    <div className="coin-images">
                      <img 
                        src={coinDetails.image_obverse || '/assets/images/coin-placeholder.jpg'} 
                        alt={`Obverse of ${coinDetails.name}`} 
                        className="coin-image obverse"
                      />
                      <img 
                        src={coinDetails.image_reverse || '/assets/images/coin-placeholder.jpg'} 
                        alt={`Reverse of ${coinDetails.name}`} 
                        className="coin-image reverse"
                      />
                    </div>
                    <div className="coin-details">
                      <h3>{coinDetails.name || 'Unknown Coin'}</h3>
                      <p className="coin-emperor">{coinDetails.emperor || 'Unknown Emperor'}</p>
                      <p className="coin-period">{coinDetails.period || 'Unknown Period'}</p>
                      <p className="coin-material">{coinDetails.material || 'Unknown Material'}</p>
                      <div className="coin-meta">
                        <span className="coin-value">
                          <i className="fas fa-balance-scale"></i> 
                          {coinDetails.estimated_value ? `${coinDetails.estimated_value} €` : 'Not valued'}
                        </span>
                        <span className="coin-date-added">
                          <i className="fas fa-calendar-alt"></i>
                          {new Date(coin.date_added).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="coin-actions">
                      <button className="action-btn view" title="View Details">
                        <i className="fas fa-eye"></i>
                      </button>
                      <button className="action-btn edit" title="Edit Coin">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="action-btn remove" title="Remove from Collection">
                        <i className="fas fa-trash"></i>
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

export default Collection;
