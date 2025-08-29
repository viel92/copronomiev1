// src/services/vercelAIService.ts

interface ExtractedOffer {
  fournisseur: string;
  typeContrat: string;
  prixMolecule: number;
  cee: number;
  transport: number;
  abonnementF: number;
  distribution: number;
  transportAnn: number;
  cta: number;
  ticgn: number;
  consommationReference?: number;
  sourceFile?: string;
  id?: string;
}

interface ProcessingStep {
  step: string;
  progress: number;
  fileName?: string;
  offersFound?: number;
}

export class VercelAIService {
  
  async processFiles(
    files: File[], 
    onProgress?: (step: ProcessingStep) => void
  ): Promise<ExtractedOffer[]> {
    const allOffers: ExtractedOffer[] = [];
    let totalProcessed = 0;
    
    onProgress?.({
      step: 'Démarrage de l\'analyse IA...',
      progress: 0
    });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        onProgress?.({
          step: `📄 Lecture de ${file.name}...`,
          progress: (i / files.length) * 20,
          fileName: file.name
        });

        // Extraire le texte
        const text = await this.extractTextFromFile(file);
        
        if (!text || text.trim().length < 50) {
          onProgress?.({
            step: `⚠️ ${file.name}: contenu trop court`,
            progress: (i / files.length) * 50,
            fileName: file.name,
            offersFound: 0
          });
          continue;
        }

        onProgress?.({
          step: `🤖 Analyse IA de ${file.name}...`,
          progress: (i / files.length) * 60,
          fileName: file.name
        });

        // Appel à l'API Vercel
        const result = await this.callVercelAPI(text, file.name);
        
        if (result.success && result.offers.length > 0) {
          const offersWithMetadata = result.offers.map(offer => ({
            ...offer,
            id: crypto.randomUUID(),
            sourceFile: file.name
          }));
          
          allOffers.push(...offersWithMetadata);
          totalProcessed += result.offers.length;
          
          onProgress?.({
            step: `✅ ${result.offers.length} offre(s) extraite(s) de ${file.name}`,
            progress: (i / files.length) * 90,
            fileName: file.name,
            offersFound: result.offers.length
          });
        } else {
          onProgress?.({
            step: `❌ Aucune offre trouvée dans ${file.name}`,
            progress: (i / files.length) * 90,
            fileName: file.name,
            offersFound: 0
          });
        }

      } catch (error) {
        console.error(`Erreur ${file.name}:`, error);
        onProgress?.({
          step: `❌ Erreur sur ${file.name}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          progress: (i / files.length) * 90,
          fileName: file.name,
          offersFound: 0
        });
      }
    }

    onProgress?.({
      step: `🎉 Terminé ! ${allOffers.length} offres extraites au total`,
      progress: 100
    });

    // Log pour debug
    console.log(`📊 Résultats finaux:`, {
      fichiers: files.length,
      offresExtraites: allOffers.length,
      fournisseurs: [...new Set(allOffers.map(o => o.fournisseur))]
    });

    return allOffers;
  }

  private async extractTextFromFile(file: File): Promise<string> {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux: ${Math.round(file.size / 1024 / 1024)}MB > 10MB`);
    }

    try {
      if (file.type === 'application/pdf') {
        return await this.extractFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        return await this.extractFromImage(file);
      } else if (file.type.includes('document') || file.name.endsWith('.docx')) {
        return await this.extractFromDocument(file);
      } else {
        return await this.readAsText(file);
      }
    } catch (error) {
      console.error(`Erreur extraction ${file.name}:`, error);
      throw new Error(`Impossible de lire ${file.name}: ${error instanceof Error ? error.message : 'Format non supporté'}`);
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    // Import dynamique pour éviter les erreurs SSR
    const pdfjsLib = await import('pdfjs-dist');
    
    // Worker configuration
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 15); // Limite pour éviter timeout
    
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText;
  }

  private async extractFromImage(file: File): Promise<string> {
    // Tesseract.js pour OCR
    const Tesseract = await import('tesseract.js');
    
    const result = await Tesseract.recognize(file, 'fra+eng', {
      logger: (m) => console.log(`OCR ${file.name}:`, m.status, m.progress)
    });
    
    return result.data.text;
  }

  private async extractFromDocument(file: File): Promise<string> {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  private async readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Erreur lecture fichier texte'));
      reader.readAsText(file, 'utf-8');
    });
  }

  private async callVercelAPI(text: string, fileName: string): Promise<any> {
    const apiUrl = '/api/extract-contracts';
    
    console.log(`📡 Appel API pour ${fileName} (${text.length} caractères)`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 15000), // Limite pour éviter les timeouts
        fileName
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log(`📥 Réponse API ${fileName}:`, {
      success: result.success,
      offersCount: result.offers?.length || 0,
      documentType: result.metadata?.documentType
    });

    return result;
  }
}

// Hook React amélioré
import { useState, useCallback } from 'react';

interface VercelProcessingState {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  currentFile: string;
  totalOffers: number;
  processedFiles: number;
  error: string | null;
}

export function useVercelAI() {
  const [state, setState] = useState<VercelProcessingState>({
    isProcessing: false,
    currentStep: '',
    progress: 0,
    currentFile: '',
    totalOffers: 0,
    processedFiles: 0,
    error: null
  });

  const processFiles = useCallback(async (files: File[]) => {
    setState({
      isProcessing: true,
      currentStep: 'Initialisation...',
      progress: 0,
      currentFile: '',
      totalOffers: 0,
      processedFiles: 0,
      error: null
    });

    try {
      const aiService = new VercelAIService();
      
      const offers = await aiService.processFiles(files, (step) => {
        setState(prev => ({
          ...prev,
          currentStep: step.step,
          progress: step.progress,
          currentFile: step.fileName || prev.currentFile,
          totalOffers: prev.totalOffers + (step.offersFound || 0),
          processedFiles: step.fileName ? prev.processedFiles + 1 : prev.processedFiles
        }));
      });

      return offers;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        currentStep: `❌ ${errorMessage}`
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      currentStep: '',
      progress: 0,
      currentFile: '',
      totalOffers: 0,
      processedFiles: 0,
      error: null
    });
  }, []);

  return {
    ...state,
    processFiles,
    reset
  };
}