// src/services/realAIService.ts

import * as pdfjsLib from 'pdfjs-dist';

// Configuration PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface ExtractedData {
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
}

export class RealAIService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractFromFile(file: File): Promise<ExtractedData> {
    let text = '';

    try {
      if (file.type === 'application/pdf') {
        text = await this.extractFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        text = await this.extractFromImage(file);
      } else if (file.type.includes('document')) {
        text = await this.extractFromDocument(file);
      } else {
        throw new Error('Type de fichier non supporté');
      }

      return await this.extractWithOpenAI(text);
    } catch (error) {
      console.error('Erreur extraction:', error);
      throw error;
    }
  }

  private async extractFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + ' ';
    }
    
    return fullText;
  }

  private async extractFromImage(file: File): Promise<string> {
    // Import dynamique de Tesseract
    const Tesseract = await import('tesseract.js');
    
    const result = await Tesseract.recognize(file, 'fra', {
      logger: m => console.log(m)
    });
    
    return result.data.text;
  }

  private async extractFromDocument(file: File): Promise<string> {
    // Import dynamique de mammoth pour les documents Word
    const mammoth = await import('mammoth');
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return result.value;
  }

  private async extractWithOpenAI(text: string): Promise<ExtractedData> {
    const prompt = `
Analyse ce contrat de fourniture de gaz français et extrait les informations tarifaires.

TEXTE DU CONTRAT:
${text.slice(0, 3000)} // Limite pour éviter les tokens excessifs

INSTRUCTIONS:
- Extrait les données tarifaires exactes
- Si une information n'est pas trouvée, utilise 0
- Les prix sont généralement en €/MWh ou €/an
- Le TICGN est souvent 17,16 €/MWh (taxe standard française)

Réponds UNIQUEMENT avec ce JSON (aucun texte supplémentaire):
{
  "fournisseur": "nom exact du fournisseur",
  "typeContrat": "type et durée (ex: Fixe 36 mois)",
  "prixMolecule": 0,
  "cee": 0,
  "transport": 0,
  "abonnementF": 0,
  "distribution": 0,
  "transportAnn": 0,
  "cta": 0,
  "ticgn": 17.16
}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Plus économique que gpt-4
          messages: [
            { 
              role: 'system', 
              content: 'Tu es un expert en contrats énergétiques français. Extrait UNIQUEMENT les données demandées au format JSON strict. Ne rajoute aucun commentaire.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 500,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Erreur OpenAI ${response.status}: ${errorData?.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const parsed = JSON.parse(content);
        return this.validateAndCleanData(parsed);
      } catch (parseError) {
        console.error('Erreur parsing JSON:', parseError, content);
        return this.fallbackExtraction(text);
      }
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      return this.fallbackExtraction(text);
    }
  }

  private validateAndCleanData(data: any): ExtractedData {
    return {
      fournisseur: String(data.fournisseur || 'Fournisseur inconnu'),
      typeContrat: String(data.typeContrat || 'Fixe 12 mois'),
      prixMolecule: this.parseFloat(data.prixMolecule) || 0,
      cee: this.parseFloat(data.cee) || 0,
      transport: this.parseFloat(data.transport) || 8.69, // Valeur par défaut
      abonnementF: this.parseFloat(data.abonnementF) || 0,
      distribution: this.parseFloat(data.distribution) || 5022.04, // Valeur typique
      transportAnn: this.parseFloat(data.transportAnn) || 1231.08, // Valeur typique
      cta: this.parseFloat(data.cta) || 304.52, // Valeur typique
      ticgn: this.parseFloat(data.ticgn) || 17.16, // Valeur légale
    };
  }

  private parseFloat(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d,.]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }

  private fallbackExtraction(text: string): ExtractedData {
    // Extraction de base par regex en cas d'échec de l'IA
    const patterns = {
      fournisseur: /(ENGIE|TotalEnergies|Total Energies|Ekwateur|Endesa|Dyneff|Gaz de Bordeaux|EDF|Vattenfall|ENI)/i,
      prix: /prix.*molécule.*?(\d+[,.]?\d*)|molécule.*?(\d+[,.]?\d*)/i,
      cee: /CEE.*?(\d+[,.]?\d*)/i,
      transport: /transport.*?(\d+[,.]?\d*)/i
    };

    const fournisseur = text.match(patterns.fournisseur)?.[0] || 'Fournisseur inconnu';
    const prixMatch = text.match(patterns.prix);
    const prixMolecule = prixMatch ? parseFloat((prixMatch[1] || prixMatch[2] || '0').replace(',', '.')) : 0;

    return {
      fournisseur,
      typeContrat: 'Fixe 12 mois',
      prixMolecule,
      cee: parseFloat(text.match(patterns.cee)?.[1]?.replace(',', '.') || '0') || 8.5,
      transport: parseFloat(text.match(patterns.transport)?.[1]?.replace(',', '.') || '0') || 8.69,
      abonnementF: 0,
      distribution: 5022.04,
      transportAnn: 1231.08,
      cta: 304.52,
      ticgn: 17.16
    };
  }
}

// Hook React pour l'utilisation
import { useState, useCallback } from 'react';

export function useRealAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: File[], apiKey: string) => {
    if (!apiKey) {
      throw new Error('Clé API OpenAI requise');
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const service = new RealAIService(apiKey);
      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentStep(`Traitement de ${file.name}...`);
        setProgress((i / files.length) * 100);

        const extracted = await service.extractFromFile(file);
        
        results.push({
          id: crypto.randomUUID(),
          name: extracted.fournisseur,
          type: extracted.typeContrat,
          prixMolecule: extracted.prixMolecule,
          cee: extracted.cee,
          transport: extracted.transport,
          abonnementF: extracted.abonnementF,
          distribution: extracted.distribution,
          transportAnn: extracted.transportAnn,
          cta: extracted.cta,
          ticgn: extracted.ticgn,
        });
      }

      setCurrentStep('Terminé !');
      setProgress(100);
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processFiles,
    isProcessing,
    progress,
    currentStep,
    error
  };
}