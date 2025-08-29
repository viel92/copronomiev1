import { useState } from 'react';
import { useVercelAI } from '../services/vercelAIService';
import { useRealAI } from '../services/realAIService';
import { supabase } from '../lib/supabaseClient';
import type { ExtractedOffer } from '../types/ai';

interface OfferWithUser extends ExtractedOffer {
  user_id: string;
}

export function useAIProcessing() {
  const vercel = useVercelAI();
  const real = useRealAI();
  const [offers, setOffers] = useState<ExtractedOffer[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  const processFiles = async (files: File[], apiKey?: string) => {
    setDbError(null);
    let result: ExtractedOffer[] = [];
    if (apiKey) {
      result = await real.processFiles(files, apiKey);
    } else {
      result = await vercel.processFiles(files);
    }
    setOffers(result);
    try {
      if (result.length) {
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setDbError(userError?.message || 'No authenticated user');
        } else {
          const offersWithUser: OfferWithUser[] = result.map(o => ({
            ...o,
            user_id: user.id
          }));
          const { error: insertError } = await supabase
            .from('offers')
            .insert(offersWithUser);
          if (insertError) {
            setDbError(insertError.message);
          }
        }
      }
    } catch (err) {
      setDbError((err as Error).message);
    }
    return result;
  };

  const reset = () => {
    setOffers([]);
    vercel.reset();
    setDbError(null);
  };

  return {
    offers,
    processFiles,
    reset,
    isProcessing: vercel.isProcessing || real.isProcessing,
    progress: real.isProcessing ? real.progress : vercel.progress,
    currentStep: real.isProcessing ? real.currentStep : vercel.currentStep,
    error: real.error || vercel.error || dbError
  };
}
