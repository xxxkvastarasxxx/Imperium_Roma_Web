import { Loader } from "lucide-react";
import "../../styles/components/LoadingOverlay.css";

const LoadingOverlay = ({ 
  isVisible = false, 
  message = "Loading...", 
  fullScreen = false,
  className = "" 
}) => {
  if (!isVisible) return null;

  return (
    <div className={`loading-overlay ${fullScreen ? 'full-screen' : ''} ${className}`}>
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
        </div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
