"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import BasicInfoSection from "./step3/BasicInfoSection";
import ColorOptionsSection from "./step3/ColorOptionsSection";
import SizeDetailsSection from "./step3/SizeDetailsSection";
import PaperDetailsSection from "./step3/PaperDetailsSection";
import FinishingOptionsSection from "./step3/FinishingOptionsSection";

export default function Step3() {
  const prevStep = useQuoteStore((state) => state.prevStep);
  const nextStep = useQuoteStore((state) => state.nextStep);
  const productDetails = useQuoteStore((state) => state.productDetails);

  const canProceed = () => {
    // Basic validation
    return productDetails.basicInfo.productName.trim() !== '' && 
           productDetails.basicInfo.quantity !== '' && 
           productDetails.basicInfo.sides !== '';
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Spesifikasi Produk
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Lengkapi detail teknis produk yang akan diestimasi.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <BasicInfoSection />
        <ColorOptionsSection />
        <SizeDetailsSection />
        <PaperDetailsSection />
        <FinishingOptionsSection />
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <button
          onClick={prevStep}
          className="px-6 py-2.5 bg-background border border-border rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
        >
          Kembali
        </button>
        <button
          onClick={nextStep}
          disabled={!canProceed()}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Lanjut ke Step 4
        </button>
      </div>
    </div>
  );
}
