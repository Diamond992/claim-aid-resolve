
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useClaimFormProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const auth = useAuth();

  const processClaimFormData = async (): Promise<boolean> => {
    if (!auth.user?.id) {
      console.error('No user authenticated');
      return false;
    }

    setIsProcessing(true);
    
    try {
      // Import the service dynamically to use the updated version
      const { processClaimFormData: processClaimData } = await import('@/services/claimFormService');
      const result = await processClaimData(auth);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, processClaimFormData };
};
