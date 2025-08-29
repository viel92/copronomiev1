// api/extract-contracts.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Logtail } from '@logtail/node';
import * as Sentry from '@sentry/node';

const logger = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN || '');
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

Sentry.init({ dsn: process.env.VITE_SENTRY_DSN });

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
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { text, fileName } = req.body;

    await logger.info('extract-contracts called', { user: user.id, fileName });

    if (!text) {
      return res.status(400).json({ error: 'Texte manquant' });
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Clé API OpenAI non configurée sur le serveur' });
    }

    console.log(`🔄 Traitement: ${fileName}`);

    // Détection du type de document
    const documentType = detectDocumentType(text);
    console.log(`📋 Type détecté: ${documentType}`);
    
    // Prompt adaptatif
    const prompt = buildAdvancedPrompt(text, fileName, documentType);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Tu es un expert en contrats énergétiques français avec 20 ans d'expérience. 

FOURNISSEURS FRANÇAIS (utilise ces noms EXACTS):
- ENGIE (jamais GDF, GDF Suez)
- TotalEnergies (jamais Total Direct Energie seul)
- EDF
- Ekwateur  
- Vattenfall
- ENI
- Dyneff
- Gaz de Bordeaux
- Planète OUI
- Mint Energie
- Alpiq
- Antargaz
- Gaz Européen

MISSION: Extrait TOUTES les offres présentes, même dans les tableaux complexes. Une ligne = une offre.

PRIORITÉ: Si c'est un tableau comparatif ou courtier, trouve toutes les lignes/offres distinctes.` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.05, // Plus déterministe
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Erreur OpenAI:', errorData);
      return res.status(response.status).json({ 
        error: `Erreur OpenAI: ${errorData?.error?.message || response.statusText}` 
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('🤖 Réponse IA:', content.slice(0, 200) + '...');

    try {
      const parsed = JSON.parse(content);
      
      // Support format multiple ou single
      let offers: ExtractedOffer[] = [];
      if (parsed.offers && Array.isArray(parsed.offers)) {
        offers = parsed.offers;
      } else if (parsed.fournisseur) {
        // Format single offer
        offers = [parsed];
      }

      const validatedOffers = offers
        .map(offer => validateOffer(offer))
        .filter(offer => offer.fournisseur !== 'Fournisseur inconnu'); // Filtrer les offres vides

      console.log(`✅ ${validatedOffers.length} offres extraites`);

      return res.status(200).json({
        success: true,
        offers: validatedOffers,
        fileName,
        metadata: {
          documentType,
          extractedOffers: validatedOffers.length,
          originalLength: offers.length
        }
      });

    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      console.log('📝 Contenu brut:', content);
      
      // Fallback extraction
      const fallbackOffers = performFallbackExtraction(text, fileName);
      console.log(`🔄 Fallback: ${fallbackOffers.length} offres`);
      
      return res.status(200).json({
        success: true,
        offers: fallbackOffers,
        fileName,
        warning: 'Données extraites par méthode de fallback',
        metadata: {
          documentType: 'fallback',
          extractedOffers: fallbackOffers.length
        }
      });
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    await logger.error('extract-contracts error', error as any);
    Sentry.captureException(error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
}

function detectDocumentType(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Compter les mentions de fournisseurs
  const providers = ['engie', 'totalenergies', 'total energies', 'edf', 'ekwateur', 'vattenfall', 'eni'];
  const mentionCount = providers.reduce((count, provider) => {
    const regex = new RegExp(provider, 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);

  // Mots-clés pour tableaux
  const tableKeywords = ['tableau', 'comparatif', 'offre', 'proposition', 'courtier', 'sélection'];
  const hasTableKeywords = tableKeywords.some(keyword => lowerText.includes(keyword));

  if (mentionCount > 5 || hasTableKeywords) {
    return 'comparison_table';
  } else if (mentionCount > 2) {
    return 'broker_table';  
  } else {
    return 'single_contract';
  }
}

function buildAdvancedPrompt(text: string, fileName: string, docType: string): string {
  const textPreview = text.slice(0, 8000); // Plus de contexte
  
  const basePrompt = `
DOCUMENT: ${fileName}
TYPE DÉTECTÉ: ${docType}

CONTENU À ANALYSER:
${textPreview}

INSTRUCTIONS SPÉCIALISÉES:
1. 🎯 FOURNISSEURS: Identifie avec précision les noms des fournisseurs français
2. 💰 PRIX: Convertis tout en €/MWh (si ct€/kWh: divise par 10)
3. 📋 TABLEAUX: Si c'est un tableau, extrait CHAQUE ligne distincte
4. 🔍 RECHERCHE: Cherche tous les tarifs même s'ils sont répartis dans le document
5. ✅ VALIDATION: Ne retourne que les offres avec données réelles (pas de 0 partout)
`;

  if (docType === 'comparison_table' || docType === 'broker_table') {
    return `${basePrompt}

⚠️ IMPORTANT: Ce document contient PLUSIEURS offres. 
Extrait TOUTES les lignes/fournisseurs différents !

Format JSON attendu:
{
  "offers": [
    {
      "fournisseur": "ENGIE",
      "typeContrat": "Fixe 36 mois",
      "prixMolecule": 35.5,
      "cee": 8.2,
      "transport": 8.69,
      "abonnementF": 6000,
      "distribution": 5022.04,
      "transportAnn": 1231.08,
      "cta": 304.52,
      "ticgn": 17.16,
      "consommationReference": 360
    },
    {
      "fournisseur": "TotalEnergies",
      "typeContrat": "Fixe 24 mois",
      "prixMolecule": 37.8,
      "cee": 8.5,
      "transport": 8.69,
      "abonnementF": 150,
      "distribution": 5022.04,
      "transportAnn": 1231.08,
      "cta": 304.52,
      "ticgn": 17.16,
      "consommationReference": 360
    }
    // ... CONTINUER pour chaque offre trouvée
  ]
}`;
  } else {
    return `${basePrompt}

Format JSON pour offre unique:
{
  "fournisseur": "nom exact",
  "typeContrat": "Fixe XX mois",
  "prixMolecule": 0,
  "cee": 0,
  "transport": 8.69,
  "abonnementF": 0,
  "distribution": 5022.04,
  "transportAnn": 1231.08,
  "cta": 304.52,
  "ticgn": 17.16,
  "consommationReference": 0
}`;
  }
}

function validateOffer(offer: any): ExtractedOffer {
  return {
    fournisseur: String(offer.fournisseur || 'Fournisseur inconnu').trim(),
    typeContrat: String(offer.typeContrat || 'Non spécifié').trim(),
    prixMolecule: parseFloatSafe(offer.prixMolecule) || 0,
    cee: parseFloatSafe(offer.cee) || 0,
    transport: parseFloatSafe(offer.transport) || 8.69,
    abonnementF: parseFloatSafe(offer.abonnementF) || 0,
    distribution: parseFloatSafe(offer.distribution) || 5022.04,
    transportAnn: parseFloatSafe(offer.transportAnn) || 1231.08,
    cta: parseFloatSafe(offer.cta) || 304.52,
    ticgn: parseFloatSafe(offer.ticgn) || 17.16,
    consommationReference: parseFloatSafe(offer.consommationReference)
  };
}

function parseFloatSafe(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,.]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function performFallbackExtraction(text: string, fileName: string): ExtractedOffer[] {
  const lowerText = text.toLowerCase();
  
  // Recherche de fournisseurs
  const providerMap = {
    'engie': 'ENGIE',
    'totalenergies': 'TotalEnergies', 
    'total energies': 'TotalEnergies',
    'edf': 'EDF',
    'ekwateur': 'Ekwateur',
    'vattenfall': 'Vattenfall',
    'eni': 'ENI',
    'dyneff': 'Dyneff'
  };

  const foundProviders = Object.keys(providerMap).filter(key => 
    lowerText.includes(key)
  );

  console.log(`🔍 Fallback trouvé: ${foundProviders.length} fournisseurs`);

  if (foundProviders.length === 0) {
    return [{
      fournisseur: 'Document analysé',
      typeContrat: 'À vérifier manuellement',
      prixMolecule: 0,
      cee: 0,
      transport: 8.69,
      abonnementF: 0,
      distribution: 5022.04,
      transportAnn: 1231.08,
      cta: 304.52,
      ticgn: 17.16
    }];
  }

  return foundProviders.map(key => ({
    fournisseur: providerMap[key as keyof typeof providerMap],
    typeContrat: 'À vérifier',
    prixMolecule: extractPriceNearProvider(text, key),
    cee: 8.5,
    transport: 8.69,
    abonnementF: 0,
    distribution: 5022.04,
    transportAnn: 1231.08,
    cta: 304.52,
    ticgn: 17.16
  }));
}

function extractPriceNearProvider(text: string, provider: string): number {
  const providerIndex = text.toLowerCase().indexOf(provider);
  if (providerIndex === -1) return 0;

  const contextText = text.substring(
    Math.max(0, providerIndex - 200),
    providerIndex + 300
  );

  // Recherche de prix en €/MWh ou ct€/kWh
  const pricePatterns = [
    /(\d+[,.]?\d*)\s*€\/MWh/gi,
    /(\d+[,.]?\d*)\s*ct?€\/kWh/gi,
    /(\d+[,.]?\d*)\s*centimes?\/kWh/gi
  ];

  for (const pattern of pricePatterns) {
    const matches = contextText.match(pattern);
    if (matches && matches.length > 0) {
      const rawPrice = parseFloat(matches[0].replace(/[^\d,.]/g, '').replace(',', '.'));
      if (!isNaN(rawPrice)) {
        // Si c'est en ct€/kWh, convertir en €/MWh
        if (pattern.source.includes('ct') || pattern.source.includes('centimes')) {
          return rawPrice / 10;
        }
        return rawPrice;
      }
    }
  }

  return 0;
}