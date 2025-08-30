import "../../styles/components/LoadingOverlay.css";

const CustomSpinner = ({ size = 16, className = "" }) => {
  const style = {
    width: `${size}px`,
    height: `${size}px`,
  };

  const beforeStyle = {
    top: `${Math.max(1, size / 8)}px`,
    left: `${Math.max(1, size / 8)}px`,
    right: `${Math.max(1, size / 8)}px`,
    bottom: `${Math.max(1, size / 8)}px`,
  };

  return (
    <div 
      className={`button-spinner-circle ${className}`}
      style={style}
    />
  );
};

export default CustomSpinner;
