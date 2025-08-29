// src/services/realPDFService.ts

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

interface ComparisonData {
  providers: any[];
  consumption: number;
  bestOffer: any;
  potentialSavings: number;
  tvaFixe: number;
  tvaVar: number;
  generatedBy: 'manual' | 'ai';
}

export class RealPDFService {
  
  static async generateComparison(data: ComparisonData): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Configuration des couleurs RGB (0-255)
    const colors = {
      primary: { r: 16, g: 185, b: 129 }, // Emerald-500
      secondary: { r: 59, g: 130, b: 246 }, // Blue-500
      text: { r: 51, g: 65, b: 85 }, // Slate-700
      lightGray: { r: 248, g: 250, b: 252 }, // Slate-50
      success: { r: 34, g: 197, b: 94 }, // Green-500
      warning: { r: 245, g: 158, b: 11 }, // Amber-500
      white: { r: 255, g: 255, b: 255 },
      gray: { r: 128, g: 128, b: 128 },
    };

    let yPos = 20;

    // === HEADER ===
    this.drawHeader(doc, colors, yPos, data.generatedBy);
    yPos = 50;

    // === RÉSUMÉ EXÉCUTIF ===
    yPos = this.drawExecutiveSummary(doc, colors, yPos, data);
    
    // === TABLEAU COMPARATIF ===
    yPos = this.drawComparisonTable(doc, colors, yPos, data);

    // === GRAPHIQUE (optionnel si suffisamment de place) ===
    if (yPos < 200) {
      yPos = this.drawChart(doc, colors, yPos, data);
    }

    // === NOUVELLE PAGE SI NÉCESSAIRE ===
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // === FORMULES ET MÉTHODOLOGIE ===
    yPos = this.drawMethodology(doc, colors, yPos, data);

    // === RECOMMANDATIONS ===
    if (yPos < 250) {
      yPos = this.drawRecommendations(doc, colors, yPos, data);
    }

    // === PIED DE PAGE ===
    this.addFooter(doc, colors);

    // === TÉLÉCHARGEMENT ===
    const fileName = `comparatif-gaz-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  private static drawHeader(doc: jsPDF, colors: any, yPos: number, generatedBy: 'manual' | 'ai'): void {
    // Background coloré
    doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Logo/Icône (simulé)
    doc.setFillColor(colors.white.r, colors.white.g, colors.white.b);
    doc.rect(15, 8, 20, 20, 'F');
    doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.setFontSize(16);
    doc.text('⚡', 25, 22);
    
    // Titre principal
    doc.setTextColor(colors.white.r, colors.white.g, colors.white.b);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPARATIF FOURNISSEURS GAZ', 45, 18);
    
    // Sous-titre
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`, 45, 25);
    
    // Badge IA
    if (generatedBy === 'ai') {
      doc.setFillColor(colors.warning.r, colors.warning.g, colors.warning.b);
      doc.roundedRect(140, 10, 25, 8, 2, 2, 'F');
      doc.setTextColor(colors.white.r, colors.white.g, colors.white.b);
      doc.setFontSize(8);
      doc.text('🤖 GÉNÉRÉ PAR IA', 142, 15);
    }
  }

  private static drawExecutiveSummary(doc: jsPDF, colors: any, yPos: number, data: ComparisonData): number {
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 RÉSUMÉ EXÉCUTIF', 20, yPos);
    yPos += 12;

    // Encadré résumé
    doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos - 2, 180, 35);
    
    doc.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    doc.rect(15, yPos - 2, 180, 35, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    
    const summaryLines = [
      `🏠 Consommation annuelle: ${data.consumption.toLocaleString('fr-FR')} MWh`,
      `🥇 Meilleure offre: ${data.bestOffer.name} - ${data.bestOffer.type}`,
      `💰 Prix TTC optimal: ${this.formatEuros(data.bestOffer.ttc)}`,
      `💡 Économies potentielles: ${this.formatEuros(data.potentialSavings)} par an`,
      `📈 ROI: ${data.potentialSavings > 0 ? '✅ Changement recommandé' : '⚠️ Contrat actuel optimal'}`
    ];

    summaryLines.forEach((line, index) => {
      doc.text(line, 20, yPos + (index * 6));
    });

    return yPos + 40;
  }

  private static drawComparisonTable(doc: jsPDF, colors: any, yPos: number, data: ComparisonData): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.text('📋 COMPARAISON DÉTAILLÉE', 20, yPos);
    yPos += 10;

    // Headers
    const headers = ['Rang', 'Fournisseur', 'Type', 'Prix Molécule', 'HT', 'TTC'];
    const colWidths = [15, 35, 30, 25, 25, 25];
    let xPos = 20;

    // Header background
    doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.rect(15, yPos, 170, 8, 'F');
    
    doc.setTextColor(colors.white.r, colors.white.g, colors.white.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 5);
      xPos += colWidths[i];
    });
    yPos += 12;

    // Rows
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.setFont('helvetica', 'normal');
    
    data.providers.forEach((provider, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }

      // Highlight best offer
      if (index === 0) {
        doc.setFillColor(220, 252, 231); // green-50
        doc.rect(15, yPos - 2, 170, 8, 'F');
        doc.setTextColor(colors.success.r, colors.success.g, colors.success.b);
        doc.text('🥇', 10, yPos + 3);
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      } else if (index === 1) {
        doc.setTextColor(colors.warning.r, colors.warning.g, colors.warning.b);
        doc.text('🥈', 10, yPos + 3);
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      } else if (index === 2) {
        doc.setTextColor(colors.warning.r, colors.warning.g, colors.warning.b);
        doc.text('🥉', 10, yPos + 3);
        doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      }

      xPos = 20;
      const rowData = [
        `#${index + 1}`,
        provider.name,
        provider.type,
        `${provider.prixMolecule.toFixed(1)} €/MWh`,
        this.formatEuros(provider.ht),
        this.formatEuros(provider.ttc)
      ];

      rowData.forEach((cell, i) => {
        doc.text(cell, xPos, yPos + 3, { maxWidth: colWidths[i] - 2 });
        xPos += colWidths[i];
      });
      
      yPos += 8;
    });

    return yPos + 10;
  }

  private static drawChart(doc: jsPDF, colors: any, yPos: number, data: ComparisonData): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.text('📊 GRAPHIQUE COMPARATIF', 20, yPos);
    yPos += 10;

    // Simple bar chart
    const maxPrice = Math.max(...data.providers.map(p => p.ttc));
    const chartWidth = 150;
    const chartHeight = 60;
    const barWidth = chartWidth / data.providers.length - 5;

    data.providers.forEach((provider, index) => {
      const barHeight = (provider.ttc / maxPrice) * chartHeight;
      const xPos = 20 + (index * (barWidth + 5));
      
      // Bar
      if (index === 0) {
        doc.setFillColor(colors.success.r, colors.success.g, colors.success.b);
      } else {
        doc.setFillColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
      }
      doc.rect(xPos, yPos + chartHeight - barHeight, barWidth, barHeight, 'F');
      
      // Label
      doc.setFontSize(7);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      doc.text(provider.name.substring(0, 8), xPos, yPos + chartHeight + 5, { 
        angle: -45,
        maxWidth: barWidth 
      });
      
      // Price
      doc.text(this.formatEuros(provider.ttc), xPos, yPos + chartHeight - barHeight - 2);
    });

    return yPos + chartHeight + 20;
  }

  private static drawMethodology(doc: jsPDF, colors: any, yPos: number, data: ComparisonData): number {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.text('🧮 MÉTHODOLOGIE DE CALCUL', 20, yPos);
    yPos += 12;

    const formulas = [
      {
        title: 'Budget Hors Taxes (HT)',
        formula: 'Consommation × (Prix molécule + CEE + Transport + TICGN) + Frais fixes annuels',
        example: `${data.consumption} MWh × (prix variable) + frais fixes`
      },
      {
        title: 'Budget Toutes Taxes Comprises (TTC)',  
        formula: '(Frais fixes × (1 + TVA fixes)) + (Frais variables × (1 + TVA variables))',
        example: `TVA fixes: ${(data.tvaFixe * 100).toFixed(1)}% • TVA variables: ${(data.tvaVar * 100).toFixed(1)}%`
      }
    ];

    formulas.forEach((f, index) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = 30;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      doc.text(`• ${f.title}`, 20, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(f.formula, 25, yPos, { maxWidth: 160 });
      yPos += 5;

      doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
      doc.text(f.example, 25, yPos);
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      yPos += 10;
    });

    return yPos;
  }

  private static drawRecommendations(doc: jsPDF, colors: any, yPos: number, data: ComparisonData): number {
    if (yPos > 240) {
      doc.addPage();
      yPos = 30;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.text('💡 RECOMMANDATIONS', 20, yPos);
    yPos += 12;

    const recommendations = [];
    
    if (data.potentialSavings > 1000) {
      recommendations.push('✅ Changement de fournisseur fortement recommandé');
      recommendations.push(`💰 Économies annuelles estimées: ${this.formatEuros(data.potentialSavings)}`);
    } else if (data.potentialSavings > 0) {
      recommendations.push('⚠️ Économies modestes possibles');
    } else {
      recommendations.push('✅ Votre contrat actuel est compétitif');
    }

    if (data.generatedBy === 'ai') {
      recommendations.push('🤖 Données extraites automatiquement - vérifiez les conditions exactes');
    }

    recommendations.push('📞 Contactez les fournisseurs pour négocier les conditions');
    recommendations.push('📅 Révisez votre contrat annuellement');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    recommendations.forEach((rec, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 30;
      }
      doc.text(rec, 20, yPos, { maxWidth: 170 });
      yPos += 6;
    });

    return yPos;
  }

  private static addFooter(doc: jsPDF, colors: any): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Ligne de séparation
      doc.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
      doc.setLineWidth(0.5);
      doc.line(15, 285, 195, 285);
      
      doc.setFontSize(8);
      doc.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      doc.text(`Page ${i}/${pageCount}`, 180, 290);
      doc.text(`Généré par Comparateur Gaz IA • ${new Date().toLocaleDateString('fr-FR')}`, 20, 290);
      
      // Disclaimer
      doc.setFontSize(6);
      doc.text('Les tarifs peuvent évoluer. Vérifiez les conditions contractuelles auprès des fournisseurs.', 20, 295);
    }
  }

  private static formatEuros(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  }
}

// Hook pour l'export PDF
export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (data: ComparisonData) => {
    setIsExporting(true);
    try {
      await RealPDFService.generateComparison(data);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPDF, isExporting };
}