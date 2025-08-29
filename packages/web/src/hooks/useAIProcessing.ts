import { useState } from 'react';
import { useVercelAI } from '../services/vercelAIService';
import { useRealAI } from '../services/realAIService';
import { supabase } from '../lib/supabaseClient';
import type { ExtractedOffer } from '../types/ai';

export function useAIProcessing() {
  const vercel = useVercelAI();
  const real = useRealAI();
  const [offers, setOffers] = useState<ExtractedOffer[]>([]);

  const processFiles = async (files: File[], apiKey?: string) => {
    let result: ExtractedOffer[] = [];
    if (apiKey) {
      result = await real.processFiles(files, apiKey);
    } else {
      result = await vercel.processFiles(files);
    }
    setOffers(result);
    try {
      if (result.length) {
        await supabase.from('offers').insert(result);
      }
    } catch (err) {
      console.error('Supabase insert failed', err);
    }
    return result;
  };

  const reset = () => {
    setOffers([]);
    vercel.reset();
  };

  return {
    offers,
    processFiles,
    reset,
    isProcessing: vercel.isProcessing || real.isProcessing,
    progress: real.isProcessing ? real.progress : vercel.progress,
    currentStep: real.isProcessing ? real.currentStep : vercel.currentStep,
    error: real.error || vercel.error
  };
}
