"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import NewCustomerForm from "./NewCustomerForm";
import ExistingCustomerTable from "./ExistingCustomerTable";

export default function Step2() {
  const quoteType = useQuoteStore((state) => state.quoteType);
  const prevStep = useQuoteStore((state) => state.prevStep);
  const nextStep = useQuoteStore((state) => state.nextStep);
  
  // Basic validation: must have customer data if new, must have selected quote if existing
  const customerData = useQuoteStore((state) => state.customerData);
  const selectedQuoteId = useQuoteStore((state) => state.selectedQuoteId);

  const canProceed = () => {
    if (quoteType === 'new') {
      return customerData.firstName.trim() !== '' && customerData.email.trim() !== '';
    }
    if (quoteType === 'existing') {
      return selectedQuoteId !== null;
    }
    return false;
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {quoteType === 'new' ? 'Informasi Pelanggan Baru' : 'Pilih Estimasi Sebelumnya'}
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          {quoteType === 'new' 
            ? 'Lengkapi data pelanggan di bawah ini untuk memulai estimasi.' 
            : 'Pilih dari riwayat estimasi yang pernah dibuat sebelumnya untuk melanjutkan.'}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-8">
        {quoteType === 'new' && <NewCustomerForm />}
        {quoteType === 'existing' && <ExistingCustomerTable />}
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
          Lanjut ke Step 3
        </button>
      </div>
    </div>
  );
}
