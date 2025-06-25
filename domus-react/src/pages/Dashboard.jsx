import { useEffect, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Loader } from 'lucide-react';

export default function Dashboard() {
  const { user, stats, recentAcquisitions } = useUser();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Симуляція завантаження даних для графіків
    setTimeout(() => {
      setChartData({
        collectionGrowth: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Collection Growth',
            data: [5, 8, 12, 15, 18, 23],
            borderColor: '#ffcc00',
            backgroundColor: 'rgba(255, 204, 0, 0.2)',
          }]
        },
        eraDistribution: {
          labels: ['Republic', 'Early Empire', 'High Empire', 'Late Empire', 'Byzantine'],
          datasets: [{
            label: 'Era Distribution',
            data: [15, 25, 40, 15, 5],
            backgroundColor: [
              '#ffcc00', '#e6b800', '#ccaa00', '#b39500', '#997f00'
            ],
          }]
        }
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <Loader className="animate-spin" size={48} />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <section className="welcome-section">
        <h1>Salve, {user?.nickname || 'Collector'}!</h1>
        <p className="date">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </section>

      <section className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-coins"></i>
          </div>
          <div className="stat-info">
            <h3>Collection</h3>
            <p className="stat-number">{stats?.totalCoins || '0'}</p>
            <p className="stat-label">coins</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-heart"></i>
          </div>
          <div className="stat-info">
            <h3>Wishlist</h3>
            <p className="stat-number">{stats?.wishlistCount || '0'}</p>
            <p className="stat-label">coins</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-balance-scale"></i>
          </div>
          <div className="stat-info">
            <h3>Value</h3>
            <p className="stat-number">${stats?.totalValue || '0'}</p>
            <p className="stat-label">estimated</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-award"></i>
          </div>
          <div className="stat-info">
            <h3>Rank</h3>
            <p className="stat-number">{user?.rank || 'Novice'}</p>
            <p className="stat-label">{stats?.rankProgress || '0'}/100</p>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="chart-section collection-growth">
          <h2>Collection Growth</h2>
          <div className="chart-container">
            {/* Тут буде використано бібліотеку для графіків, наприклад Chart.js */}
            <div className="chart-placeholder">
              [Collection Growth Chart]
            </div>
          </div>
        </section>

        <section className="chart-section era-distribution">
          <h2>Era Distribution</h2>
          <div className="chart-container">
            {/* Тут буде використано бібліотеку для графіків, наприклад Chart.js */}
            <div className="chart-placeholder">
              [Era Distribution Chart]
            </div>
          </div>
        </section>

        <section className="recent-acquisitions">
          <h2>Recent Acquisitions</h2>
          
          {recentAcquisitions && recentAcquisitions.length > 0 ? (
            <div className="acquisitions-list">
              {recentAcquisitions.slice(0, 5).map((coin, index) => (
                <div className="acquisition-item" key={index}>
                  <img 
                    src={coin.imageUrl || '/assets/images/coin-placeholder.png'} 
                    alt={coin.name} 
                    className="coin-thumbnail"
                  />
                  <div className="acquisition-info">
                    <h4>{coin.name}</h4>
                    <p>{coin.type} • {coin.year}</p>
                    <p className="acquisition-date">
                      Added: {new Date(coin.addedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No recent acquisitions to show</p>
          )}
          
          <a href="/collection" className="see-all-link">
            See all coins <i className="fas fa-arrow-right"></i>
          </a>
        </section>

        <section className="activity-feed">
          <h2>Activity Feed</h2>
          
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-plus-circle"></i>
              </div>
              <div className="activity-info">
                <p className="activity-text">You added <strong>Severus Denarius</strong> to your collection</p>
                <p className="activity-time">2 days ago</p>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-heart"></i>
              </div>
              <div className="activity-info">
                <p className="activity-text">You added <strong>Hadrian Aureus</strong> to your wishlist</p>
                <p className="activity-time">5 days ago</p>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">
                <i className="fas fa-edit"></i>
              </div>
              <div className="activity-info">
                <p className="activity-text">You updated details for <strong>Augustus Denarius</strong></p>
                <p className="activity-time">1 week ago</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
