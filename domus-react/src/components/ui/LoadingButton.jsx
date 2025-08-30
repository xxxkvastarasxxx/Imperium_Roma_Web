import Button from "./Button";
import CustomSpinner from "./CustomSpinner";

const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = "Loading...", 
  loadingIcon,
  disabled,
  ...props 
}) => {
  const defaultLoadingIcon = <CustomSpinner size={16} />;

  return (
    <Button 
      {...props} 
      disabled={loading || disabled}
      className={`${props.className || ""} ${loading ? "loading" : ""}`}
    >
      {loading ? (
        <>
          {loadingIcon || defaultLoadingIcon}
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;
