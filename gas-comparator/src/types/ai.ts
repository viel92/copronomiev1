export interface ExtractedOffer {
  id?: string;
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
}
