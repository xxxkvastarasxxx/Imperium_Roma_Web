import "../../styles/components/LoadingOverlay.css";

const SkeletonLoader = ({ 
  type = "text", 
  width = "100%", 
  height = "16px", 
  count = 1,
  className = ""
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return <div className={`skeleton skeleton-card ${className}`} style={{ width, height: height || "200px" }} />;
      
      case "avatar":
        return <div className={`skeleton skeleton-avatar ${className}`} style={{ width: width || "40px", height: height || "40px" }} />;
      
      case "text":
      default:
        return Array.from({ length: count }, (_, index) => (
          <div 
            key={index} 
            className={`skeleton skeleton-text ${className}`} 
            style={{ width: index === count - 1 ? "80%" : width, height }} 
          />
        ));
    }
  };

  return <>{renderSkeleton()}</>;
};

export default SkeletonLoader;
