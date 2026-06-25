"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4CSR from "./Step4CSR";
import Step5 from "./Step5";

const STEPS = [
  { id: 1, label: "Tipe", hint: "Jenis estimasi" },
  { id: 2, label: "Pelanggan", hint: "Data klien" },
  { id: 3, label: "Produk", hint: "Spesifikasi cetak" },
  { id: 4, label: "Produksi", hint: "Imposisi & biaya" },
  { id: 5, label: "Ringkasan", hint: "Review & simpan" },
];

export default function QuoteWizardLayoutCSR() {
  const currentStep = useQuoteStore((state) => state.currentStep);
  const setStep = useQuoteStore((state) => state.setStep);

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

  const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-5xl transition-all duration-300 md:px-6 lg:px-10">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="14" width="12" height="8" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 9V2h12v7" />
              </svg>
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
                Quote Builder · Client-Side
              </span>
            </div>
            <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Create Quote
            </h1>
          </div>
          <div className="flex items-baseline gap-2 self-start rounded-lg border border-border bg-muted/40 px-3 py-2 sm:self-auto">
            <span className="font-mono text-2xl font-bold leading-none text-primary tabular-nums">
              {String(currentStep).padStart(2, "0")}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              / {String(STEPS.length).padStart(2, "0")}
            </span>
          </div>
        </header>

        {/* Stepper */}
        <nav aria-label="Progress" className="mb-10">
          <div className="relative flex items-start justify-between">
            {/* connector track — spans from the first node center (10%) to the last (90%) */}
            <div className="absolute top-4 h-[2px] bg-border" style={{ left: "10%", right: "10%" }} />
            <div
              className="absolute top-4 h-[2px] bg-primary transition-all duration-500 ease-out"
              style={{ left: "10%", width: `${progress * 0.8}%` }}
            />
            {STEPS.map((step) => {
              const done = step.id < currentStep;
              const active = step.id === currentStep;
              const reachable = step.id <= currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => reachable && setStep(step.id)}
                  disabled={!reachable}
                  className={`group relative z-10 flex min-w-0 flex-1 flex-col items-center gap-2 ${
                    reachable ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-bold transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/15"
                        : done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {done ? (
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </span>
                  <span className="flex flex-col items-center text-center">
                    <span
                      className={`text-xs font-semibold leading-tight ${
                        active
                          ? "text-foreground"
                          : reachable
                            ? "text-muted-foreground group-hover:text-foreground"
                            : "text-muted-foreground/60"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="mt-0.5 hidden font-mono text-[10px] text-muted-foreground/70 sm:block">
                      {step.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="min-h-[400px]">{renderStep()}</div>
      </div>
    </div>
  );
}
