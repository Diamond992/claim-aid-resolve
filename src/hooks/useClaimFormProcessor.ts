
import { useState } from 'react';
import { processClaimFormData as processClaimData } from '@/services/claimFormService';

export const useClaimFormProcessor = (userId?: string) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processClaimFormData = async (): Promise<boolean> => {
    if (!userId) {
      console.error('No userId provided');
      return false;
    }

    setIsProcessing(true);
    const result = await processClaimData(userId);
    setIsProcessing(false);
    return result;
  };

  return { isProcessing, processClaimFormData };
};
