"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import CardPaperDetails from "./step4/CardPaperDetails";
import CardPaperPricing from "./step4/CardPaperPricing";
import CardAdditionalCosts from "./step4/CardAdditionalCosts";
import CanvasVisualizer from "./step4/CanvasVisualizer";

export default function Step4() {
  const prevStep = useQuoteStore((state) => state.prevStep);
  const nextStep = useQuoteStore((state) => state.nextStep);
  const opDetails = useQuoteStore((state) => state.operationalDetails);

  // Validation: just check if mandatory comment is filled for custom costs
  const hasInvalidCustomCost = opDetails.additionalCosts.customCosts.some(c => !c.comment.trim());

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Operational Details
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Kalkulasi produksi presisi tinggi dan optimasi tata letak potong.
        </p>
      </div>

      <div className="space-y-8 mb-8">
        
        {/* Top Section: 3 Grid Cards */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">1. Specialty Paper</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CardPaperDetails />
            <CardPaperPricing />
            <CardAdditionalCosts />
          </div>
        </div>

        {/* Bottom Section: Sheet Layout Visualization */}
        <CanvasVisualizer />

      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 bg-background border border-border rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
        >
          Kembali
        </button>
        <button
          onClick={nextStep}
          disabled={hasInvalidCustomCost}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lanjut ke Summary
        </button>
      </div>
    </div>
  );
}
