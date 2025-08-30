
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

    // Check for atomic lock to prevent parallel execution
    const lockKey = `claim_processing_lock_${auth.user.id}`;
    const currentLock = sessionStorage.getItem(lockKey);
    
    if (currentLock) {
      console.log('🔒 Processing already in progress, skipping duplicate call');
      return false;
    }

    // Prevent infinite processing loops
    if (processingAttempts.current >= maxAttempts) {
      console.error('❌ Maximum processing attempts reached, stopping automatic processing');
      clearClaimFormData(); // Clean up to prevent further attempts
      sessionStorage.removeItem(lockKey); // Clear any stale lock
      return false;
    }

    // Set atomic lock immediately
    sessionStorage.setItem(lockKey, Date.now().toString());
    setIsProcessing(true);
    processingAttempts.current += 1;
    
    try {
      // Check if claim data still exists
      const claimData = localStorage.getItem('claimFormData');
      if (!claimData) {
        console.log('ℹ️ No claim data found, nothing to process');
        return false;
      }

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
      // Always clear the lock and processing state
      sessionStorage.removeItem(lockKey);
      setIsProcessing(false);
    }
  };

  const resetProcessingAttempts = () => {
    processingAttempts.current = 0;
    // Clear any stale locks
    if (auth.user?.id) {
      const lockKey = `claim_processing_lock_${auth.user.id}`;
      sessionStorage.removeItem(lockKey);
    }
  };

  return { 
    isProcessing, 
    processClaimFormData, 
    resetProcessingAttempts,
    attemptCount: processingAttempts.current 
  };
};
