"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import CardPaperDetails from "./step4/CardPaperDetails";
import CardPaperPricing from "./step4/CardPaperPricing";
import CardAdditionalCosts from "./step4/CardAdditionalCosts";
import CanvasVisualizerCSR from "./step4/CanvasVisualizerCSR";

export default function Step4CSR() {
  const prevStep = useQuoteStore((state) => state.prevStep);
  const nextStep = useQuoteStore((state) => state.nextStep);
  const opDetails = useQuoteStore((state) => state.operationalDetails);

  // Validation: just check if mandatory comment is filled for custom costs
  const hasInvalidCustomCost = opDetails.additionalCosts.customCosts.some(c => !c.comment.trim());

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Step 4 · Production
        </span>
        <h2 className="mt-1.5 text-3xl font-bold tracking-tight text-foreground">
          Operational Details
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Tentukan stok kertas dan biaya, lalu tinjau imposisi gang-run yang dihitung di browser.
        </p>
      </div>

      <div className="space-y-10 mb-8">

        {/* Top Section: Paper, pricing & costs */}
        <div>
          <SectionHeader index="01" title="Paper, Pricing & Costs" hint="Stok material dan komponen biaya produksi" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CardPaperDetails />
            <CardPaperPricing />
            <CardAdditionalCosts />
          </div>
        </div>

        {/* Bottom Section: Sheet Layout Visualization */}
        <div>
          <SectionHeader index="02" title="Sheet Layout & Imposition" hint="Tata letak potong gang-run pada press sheet" />
          <CanvasVisualizerCSR />
        </div>

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

function SectionHeader({
  index,
  title,
  hint,
}: {
  index: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-sm font-bold text-primary">{index}</span>
      <div className="h-4 w-px bg-border" />
      <div>
        <h3 className="text-base font-bold leading-tight text-foreground">{title}</h3>
        <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
