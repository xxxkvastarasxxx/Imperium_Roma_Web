import { useState } from 'react';
import { LoadingButton, LoadingOverlay } from '../ui';

/**
 * Enhanced form component with built-in loading states
 */
const LoadingForm = ({ 
  onSubmit, 
  children, 
  loading = false,
  disabled = false,
  loadingMessage = "Processing...",
  submitText = "Submit",
  submitLoadingText = "Submitting...",
  showOverlay = false,
  className = "",
  ...props 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading || disabled || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(e);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <form 
      {...props} 
      className={`loading-form ${className} ${isLoading ? 'loading' : ''}`}
      onSubmit={handleSubmit}
    >
      {showOverlay && (
        <LoadingOverlay 
          isVisible={isLoading} 
          message={loadingMessage}
        />
      )}
      
      <div className="form-content" style={{ opacity: isLoading && !showOverlay ? 0.6 : 1 }}>
        {children}
      </div>
      
      <div className="form-actions">
        <LoadingButton
          type="submit"
          loading={isLoading}
          loadingText={submitLoadingText}
          disabled={disabled}
          variant="primary"
        >
          {submitText}
        </LoadingButton>
      </div>
    </form>
  );
};

export default LoadingForm;
