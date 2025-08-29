import React, { useState } from 'react';
import { Upload, ArrowLeft } from 'lucide-react';
import { useAIProcessing } from '../../hooks/useAIProcessing';
import type { ProviderRow } from '../../App';

interface Props {
  onDataExtracted: (data: ProviderRow[]) => void;
  onBack: () => void;
}

export default function AIUploadSection({ onDataExtracted, onBack }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const { processFiles, isProcessing, progress, currentStep, error } = useAIProcessing();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleAnalyze = async () => {
    const offers = await processFiles(files);
    const rows: ProviderRow[] = offers.map(o => ({
      id: o.id || crypto.randomUUID(),
      name: o.fournisseur,
      type: o.typeContrat,
      prixMolecule: o.prixMolecule,
      cee: o.cee,
      transport: o.transport,
      abonnementF: o.abonnementF,
      distribution: o.distribution,
      transportAnn: o.transportAnn,
      cta: o.cta,
      ticgn: o.ticgn
    }));
    onDataExtracted(rows);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600">
        <ArrowLeft size={16} /> Retour
      </button>
      <input type="file" multiple onChange={handleFiles} className="block" />
      <button
        onClick={handleAnalyze}
        disabled={files.length === 0 || isProcessing}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded"
      >
        <Upload size={16} />
        {isProcessing ? `Analyse ${Math.round(progress)}%` : 'Analyser'}
      </button>
      {currentStep && <p className="text-sm text-slate-500">{currentStep}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
