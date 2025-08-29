import { useState } from 'react';
import { useVercelAI } from '../services/vercelAIService';
import { supabase } from '../lib/supabaseClient';
import type { ExtractedOffer } from '../types/ai';

export function useAIProcessing() {
  const vercel = useVercelAI();
  const [offers, setOffers] = useState<ExtractedOffer[]>([]);

  const processFiles = async (files: File[]) => {
    const result = await vercel.processFiles(files);
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
    isProcessing: vercel.isProcessing,
    progress: vercel.progress,
    currentStep: vercel.currentStep,
    error: vercel.error
  };
}
