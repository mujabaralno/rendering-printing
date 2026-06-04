"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4CSR from "./Step4CSR";
import Step5 from "./Step5";

export default function QuoteWizardLayoutCSR() {
  const currentStep = useQuoteStore((state) => state.currentStep);
  const prevStep = useQuoteStore((state) => state.prevStep);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 />;
      case 2:
        return <Step2 />;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4CSR />;
      case 5:
        return <Step5 />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-4 ">
      <div className="max-w-5xl mx-auto   md:p-10 lg:p-12 transition-all duration-300">
        {/* Header & Progress Bar */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-card-foreground tracking-tight">
                Create Quote
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Estimasi Harga Cepat & Akurat
              </p>
            </div>
            <div className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <span className="text-primary font-semibold">
                Langkah {currentStep} dari 5
              </span>
            </div>
          </div>

          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            >
              <div
                className="absolute top-0 right-0 bottom-0 left-0 bg-white/20"
                style={{ animation: "shimmer 2s infinite" }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <span
                key={step}
                className={`text-xs font-medium ${step <= currentStep ? "text-primary" : "text-muted-foreground"}`}
              >
                Step {step}
              </span>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">{renderStep()}</div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `,
        }}
      />
    </div>
  );
}
