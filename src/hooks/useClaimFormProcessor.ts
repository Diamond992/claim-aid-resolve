
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { clearClaimFormData } from '@/utils/cacheUtils';

export const useClaimFormProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const auth = useAuth();
  const processingAttempts = useRef(0);
  const maxAttempts = 3;

  const processClaimFormData = async (): Promise<boolean> => {
    if (!auth.user?.id) {
      console.error('No user authenticated');
      return false;
    }

    // Prevent infinite processing loops
    if (processingAttempts.current >= maxAttempts) {
      console.error('❌ Maximum processing attempts reached, stopping automatic processing');
      clearClaimFormData(); // Clean up to prevent further attempts
      return false;
    }

    setIsProcessing(true);
    processingAttempts.current += 1;
    
    try {
      // Import the service dynamically to use the updated version
      const { processClaimFormData: processClaimData } = await import('@/services/claimFormService');
      const result = await processClaimData(auth);
      
      if (result) {
        // Reset attempts counter on success
        processingAttempts.current = 0;
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error in claim processing hook:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcessingAttempts = () => {
    processingAttempts.current = 0;
  };

  return { 
    isProcessing, 
    processClaimFormData, 
    resetProcessingAttempts,
    attemptCount: processingAttempts.current 
  };
};
