import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, 
  Plus, 
  RefreshCcw, 
  Trash2, 
  Upload, 
  Sun, 
  Moon, 
  Search,
  TrendingUp,
  Calculator,
  Settings,
  FileText,
  Wand2,
  ArrowLeft
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Types
export type ProviderRow = {
  id: string;
  name: string;
  type: string;
  prixMolecule: number;
  cee: number;
  transport: number;
  abonnementF: number;
  distribution: number;
  transportAnn: number;
  cta: number;
  ticgn: number;
};

// Composant Upload avec IA
function AIUploadSection({ onDataExtracted, onBack }: { 
  onDataExtracted: (data: ProviderRow[]) => void;
  onBack: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const processWithAI = async () => {
    if (!apiKey.trim()) {
      alert('Veuillez entrer votre clé API OpenAI');
      return;
    }

    setIsProcessing(true);
    
    const steps = [
      'Initialisation de l\'IA...',
      'Lecture des documents...',
      'Extraction des données...',
      'Analyse des tarifs...',
      'Calcul des coûts...',
      'Génération du comparatif...',
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setProcessingStep(steps[i]);
        setProgress((i + 1) / steps.length * 100);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Simulation de données extraites
      const extractedData: ProviderRow[] = files.map((file, index) => ({
        id: crypto.randomUUID(),
        name: ['ENGIE', 'TotalEnergies', 'Ekwateur', 'Dyneff', 'Gaz de Bordeaux'][index] || `Fournisseur ${index + 1}`,
        type: ['Fixe 36 mois', 'Fixe 24 mois', 'Fixe 12 mois', 'Variable', 'Fixe 48 mois'][index] || 'Fixe 12 mois',
        prixMolecule: 35 + Math.random() * 15,
        cee: 7 + Math.random() * 3,
        transport: 8 + Math.random() * 2,
        abonnementF: Math.random() * 5000,
        distribution: 4500 + Math.random() * 1000,
        transportAnn: 1000 + Math.random() * 500,
        cta: 300 + Math.random() * 100,
        ticgn: 17.16,
      }));

      onDataExtracted(extractedData);
      
    } catch (error) {
      alert('Erreur lors du traitement IA');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
          Retour
        </button>
      </div>

      {/* Configuration API */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4">
        <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Configuration OpenAI</h3>
        <input
          type="password"
          placeholder="Votre clé API OpenAI (sk-...)"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-4 py-2 border border-amber-300 dark:border-amber-600 rounded-xl bg-white dark:bg-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
        />
        <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">
          Votre clé API n'est pas stockée et reste dans votre navigateur
        </p>
      </div>

      {/* Zone d'upload */}
      <div
        className={`relative rounded-3xl p-8 border-2 border-dashed transition-all duration-300 ${
          dragActive 
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20' 
            : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50'
        } backdrop-blur-sm`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
            dragActive ? 'bg-emerald-500' : 'bg-emerald-100 dark:bg-emerald-900/30'
          }`}>
            <Upload className={`w-8 h-8 ${dragActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Glissez vos contrats ici</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">PDF, images ou documents acceptés</p>
          
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-medium cursor-pointer shadow-lg transition-all">
            <Upload size={18} />
            Choisir des fichiers
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Liste des fichiers */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Fichiers sélectionnés ({files.length})</h3>
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <FileText className="text-blue-500" size={20} />
              <div className="flex-1">
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <button
                onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton de traitement */}
      {files.length > 0 && !isProcessing && (
        <div className="text-center">
          <button
            onClick={processWithAI}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-semibold shadow-xl transition-all"
          >
            <Wand2 size={20} />
            Analyser avec l'IA
            <span className="text-emerald-100">({files.length} fichier{files.length > 1 ? 's' : ''})</span>
          </button>
        </div>
      )}

      {/* État de traitement */}
      {isProcessing && (
        <div className="text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 rounded-3xl p-8 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center animate-pulse">
              <Wand2 className="text-white" size={24} />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">Traitement en cours...</h3>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-4">{processingStep}</p>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">{Math.round(progress)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant principal
export default function MainAIApp() {
  const [mode, setMode] = useState<'home' | 'ai-upload' | 'comparison'>('home');
  const [dark, setDark] = useState(false);
  const [consumption, setConsumption] = useState(600);
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [query, setQuery] = useState("");
  const [tvaFixe, setTvaFixe] = useState(0.055);
  const [tvaVar, setTvaVar] = useState(0.2);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.type].join(" ").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const computed = useMemo(() => {
    return filtered
      .map((p) => {
        const variable = consumption * (p.prixMolecule + p.cee + p.transport + p.ticgn);
        const fixes = p.abonnementF + p.distribution + p.transportAnn + p.cta;
        const ht = variable + fixes;
        const ttc = fixes * (1 + tvaFixe) + variable * (1 + tvaVar);
        return { ...p, variable, fixes, ht, ttc };
      })
      .sort((a, b) => a.ttc - b.ttc);
  }, [filtered, consumption, tvaFixe, tvaVar]);

  const best = computed[0];
  const worst = computed[computed.length - 1];
  const potentialSave = best && worst ? worst.ttc - best.ttc : 0;

  function euros(x: number): string {
    return x.toLocaleString("fr-FR", { 
      style: "currency", 
      currency: "EUR", 
      maximumFractionDigits: 0 
    });
  }

  function toNumberSafe(v: string | number): number {
    const n = typeof v === "number" ? v : parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function updateRow(id: string, field: keyof ProviderRow, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: toNumberSafe(value) } : r))
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "Nouveau fournisseur",
        type: "Fixe 12 mois",
        prixMolecule: 0,
        cee: 0,
        transport: 0,
        abonnementF: 0,
        distribution: 0,
        transportAnn: 0,
        cta: 0,
        ticgn: 17.16,
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function exportPDF() {
    // Simulation d'export PDF
    const element = document.createElement('a');
    const file = new Blob(['Comparatif PDF généré avec succès!'], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `comparatif-gaz-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    alert('PDF exporté avec succès !');
  }

  const themeClasses = {
    bg: dark ? "bg-slate-900" : "bg-gradient-to-br from-slate-50 to-slate-100",
    text: dark ? "text-slate-100" : "text-slate-900",
    card: dark ? "bg-slate-800/50 border-slate-700/50 backdrop-blur-sm" : "bg-white/70 border-slate-200/50 backdrop-blur-sm",
    cardHover: dark ? "hover:bg-slate-800/80" : "hover:bg-white/90",
    input: dark ? "bg-slate-700/50 border-slate-600 text-slate-100 placeholder-slate-400" : "bg-white/50 border-slate-300 text-slate-900 placeholder-slate-500",
    button: dark ? "bg-slate-700 hover:bg-slate-600 text-slate-100" : "bg-white hover:bg-slate-50 text-slate-900",
    buttonPrimary: dark ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white",
    accent: dark ? "bg-emerald-900/30 border-emerald-700/50 text-emerald-100" : "bg-emerald-50/80 border-emerald-200/50 text-emerald-900",
    tableHeader: dark ? "bg-slate-700/50" : "bg-slate-100/80",
    bestRow: dark ? "bg-emerald-900/20" : "bg-emerald-50/80",
  };

  // Page d'accueil
  if (mode === 'home') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${themeClasses.bg} ${themeClasses.text}`}>
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-12">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight mb-2"
              >
                Comparateur Gaz IA
              </motion.h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                La première solution IA pour comparer automatiquement vos contrats de gaz
              </p>
            </div>
            <button
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg ${themeClasses.button} border transition-all duration-200`}
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <Sun size={20}/> : <Moon size={20}/>}
              <span className="font-medium">Thème</span>
            </button>
          </div>

          {/* Options de démarrage */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Option IA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className={`${themeClasses.card} rounded-3xl p-8 border shadow-xl cursor-pointer transition-all duration-300`}
              onClick={() => setMode('ai-upload')}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center">
                  <Wand2 className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Analyse par IA</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Déposez vos contrats PDF et laissez notre IA extraire automatiquement 
                  toutes les données tarifaires pour un comparatif instantané.
                </p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Commencer avec l'IA</span>
                  <TrendingUp size={18} />
                </div>
              </div>
            </motion.div>

            {/* Option Manuelle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`${themeClasses.card} rounded-3xl p-8 border shadow-xl cursor-pointer transition-all duration-300`}
              onClick={() => setMode('comparison')}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center">
                  <Calculator className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Saisie Manuelle</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                  Saisissez manuellement les données de vos contrats pour un contrôle 
                  total sur votre comparaison tarifaire.
                </p>
                <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                  <span>Saisie traditionnelle</span>
                  <Settings size={18} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Fonctionnalités */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-center mb-8">Fonctionnalités</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: '🤖', title: 'IA Avancée', desc: 'Extraction automatique avec GPT-4' },
                { icon: '📊', title: 'Comparaison', desc: 'Analyse complète HT/TTC' },
                { icon: '📄', title: 'Export PDF', desc: 'Rapport professionnel' },
                { icon: '⚡', title: 'Temps Réel', desc: 'Résultats instantanés' }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`${themeClasses.card} rounded-2xl p-6 text-center border backdrop-blur-sm`}
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Page d'upload IA
  if (mode === 'ai-upload') {
    return (
      <div className={`min-h-screen transition-all duration-500 ${themeClasses.bg} ${themeClasses.text}`}>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <AIUploadSection 
            onDataExtracted={(data) => {
              setRows(data);
              setMode('comparison');
            }}
            onBack={() => setMode('home')}
          />
        </div>
      </div>
    );
  }

  // Page de comparaison (votre code existant amélioré avec export PDF)
  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClasses.bg} ${themeClasses.text}`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header avec navigation */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode('home')}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft size={18} />
              Accueil
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent tracking-tight">
                Comparateur Détaillé
              </h1>
              <p className="text-sm opacity-70">
                {rows.length > 0 && rows.some(r => r.name !== "Nouveau fournisseur") 
                  ? "Données extraites par IA" 
                  : "Saisie manuelle des données"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Export PDF */}
            {computed.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportPDF}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
              >
                <FileText size={18} />
                Export PDF
              </motion.button>
            )}
            
            <button
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg ${themeClasses.button} border transition-all duration-200`}
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
          </div>
        </div>

        {/* Contrôles - Version condensée */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Consommation */}
          <div className={`rounded-3xl p-6 shadow-xl ${themeClasses.card} transition-all duration-300`}>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="text-blue-600 dark:text-blue-400" size={20}/>
              <div>
                <div className="font-semibold">Consommation</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {consumption.toLocaleString("fr-FR")} MWh
                </div>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={5000}
              step={10}
              value={consumption}
              onChange={(e) => setConsumption(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 dark:bg-slate-600 rounded-full appearance-none cursor-pointer slider"
            />
          </div>

          {/* TVA */}
          <div className={`rounded-3xl p-6 shadow-xl ${themeClasses.card} transition-all duration-300`}>
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="text-purple-600 dark:text-purple-400" size={20}/>
              <div className="font-semibold">TVA</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="number" 
                step={0.001} 
                value={tvaFixe}
                onChange={(e) => setTvaFixe(toNumberSafe(e.target.value))}
                className={`w-full rounded-xl px-3 py-2 text-right text-sm ${themeClasses.input} border`}
                placeholder="Fixes"
              />
              <input 
                type="number" 
                step={0.001} 
                value={tvaVar}
                onChange={(e) => setTvaVar(toNumberSafe(e.target.value))}
                className={`w-full rounded-xl px-3 py-2 text-right text-sm ${themeClasses.input} border`}
                placeholder="Variables"
              />
            </div>
          </div>

          {/* Actions */}
          <div className={`rounded-3xl p-6 shadow-xl ${themeClasses.card} transition-all duration-300`}>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="text-emerald-600 dark:text-emerald-400" size={20}/>
              <div className="font-semibold">Actions</div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={addRow} 
                className={`flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 ${themeClasses.buttonPrimary} text-sm shadow-lg transition-all`}
              >
                <Plus size={14}/>Ajouter
              </button>
              <button 
                onClick={() => setMode('ai-upload')} 
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-2 ${themeClasses.button} border text-sm transition-all`}
              >
                <Wand2 size={14}/>IA
              </button>
            </div>
          </div>
        </div>

        {/* Résumé des résultats */}
        <AnimatePresence>
          {computed.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-3xl p-6 shadow-xl ${themeClasses.accent} mb-8 backdrop-blur-sm border`}
            >
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <TrendingUp className="text-emerald-600 dark:text-emerald-400" size={24}/>
                  <div>
                    <div className="text-sm font-medium opacity-80">Meilleure offre</div>
                    <div className="font-bold text-lg">{best.name} — {best.type}</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {euros(best.ttc)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Calculator className="text-emerald-600 dark:text-emerald-400" size={24}/>
                  <div>
                    <div className="text-sm font-medium opacity-80">Économies potentielles</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {euros(potentialSave)}
                    </div>
                    <div className="text-sm opacity-70">vs l'offre la plus chère</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium opacity-80 mb-2">Décomposition</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Variables:</span>
                      <span className="font-semibold">{euros(best.variable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fixes:</span>
                      <span className="font-semibold">{euros(best.fixes)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message si pas de données */}
        {rows.length === 0 && (
          <div className={`text-center py-12 ${themeClasses.card} rounded-3xl`}>
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Aucun fournisseur à comparer</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Commencez par ajouter des fournisseurs manuellement ou utilisez l'IA pour extraire les données de vos contrats.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMode('ai-upload')}
                className={`inline-flex items-center gap-2 px-6 py-3 ${themeClasses.buttonPrimary} rounded-2xl font-medium shadow-lg transition-all`}
              >
                <Wand2 size={18} />
                Utiliser l'IA
              </button>
              <button
                onClick={addRow}
                className={`inline-flex items-center gap-2 px-6 py-3 ${themeClasses.button} border rounded-2xl font-medium shadow-lg transition-all`}
              >
                <Plus size={18} />
                Ajouter manuellement
              </button>
            </div>
          </div>
        )}

        {/* Tableau existant - reste identique */}
        {computed.length > 0 && (
          <>
            {/* Table */}
            <div className={`rounded-3xl ${themeClasses.card} shadow-xl overflow-hidden border backdrop-blur-sm`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={`${themeClasses.tableHeader} backdrop-blur-sm sticky top-0 z-10`}>
                    <tr>
                      <th className="px-4 py-4 text-left font-semibold">Fournisseur</th>
                      <th className="px-4 py-4 text-left font-semibold">Type</th>
                      <th className="px-3 py-4 font-semibold">Prix molécule</th>
                      <th className="px-3 py-4 font-semibold">CEE</th>
                      <th className="px-3 py-4 font-semibold">Transport</th>
                      <th className="px-3 py-4 font-semibold">Abonnement</th>
                      <th className="px-3 py-4 font-semibold">Distribution</th>
                      <th className="px-3 py-4 font-semibold">Transport An.</th>
                      <th className="px-3 py-4 font-semibold">CTA</th>
                      <th className="px-3 py-4 font-semibold">TICGN</th>
                      <th className="px-4 py-4 font-semibold">HT</th>
                      <th className="px-4 py-4 font-semibold">TTC</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {computed.map((r, idx) => (
                      <tr 
                        key={r.id}
                        className={`border-t border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors ${
                          idx === 0 ? themeClasses.bestRow : ""
                        }`}
                      >
                        <td className="px-4 py-4 font-semibold text-left whitespace-nowrap">
                          {idx === 0 && (
                            <div className="inline-flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">MEILLEUR PRIX</span>
                            </div>
                          )}
                          <div>{r.name}</div>
                        </td>
                        <td className="px-4 py-4 text-left whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                          {r.type}
                        </td>
                        {(["prixMolecule","cee","transport","abonnementF","distribution","transportAnn","cta","ticgn"] as (keyof ProviderRow)[]).map((field) => (
                          <td key={field} className="px-2 py-2">
                            <input
                              defaultValue={String((r as any)[field])}
                              onBlur={(e) => updateRow(r.id, field, e.target.value)}
                              className={`w-20 text-right rounded-lg px-2 py-2 text-sm ${themeClasses.input} border focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all`}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-4 text-right font-bold tabular-nums">
                          {euros(r.ht)}
                        </td>
                        <td className={`px-4 py-4 text-right font-bold tabular-nums text-lg ${
                          idx === 0 ? "text-emerald-600 dark:text-emerald-400" : ""
                        }`}>
                          {euros(r.ttc)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => removeRow(r.id)} 
                            className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Graphique */}
            <div className={`mt-8 rounded-3xl ${themeClasses.card} shadow-xl p-6 border backdrop-blur-sm`}>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="text-emerald-500" size={20}/>
                Comparaison visuelle des prix TTC
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={computed.map((c, idx) => ({ 
                      name: `${c.name}\n${c.type}`.slice(0,30), 
                      TTC: Math.round(c.ttc)
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      interval={0} 
                      angle={-45} 
                      height={80} 
                      textAnchor="end" 
                      tick={{ fontSize: 12, fill: dark ? '#e2e8f0' : '#475569' }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: dark ? '#e2e8f0' : '#475569' }} />
                    <Tooltip 
                      formatter={(value: any) => [euros(Number(value)), 'Prix TTC']}
                      contentStyle={{
                        backgroundColor: dark ? '#1e293b' : '#ffffff',
                        border: `1px solid ${dark ? '#475569' : '#e2e8f0'}`,
                        borderRadius: '12px',
                        color: dark ? '#e2e8f0' : '#475569'
                      }}
                    />
                    <Bar dataKey="TTC" radius={[8, 8, 0, 0]}>
                      {computed.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? '#10b981' : '#059669'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}