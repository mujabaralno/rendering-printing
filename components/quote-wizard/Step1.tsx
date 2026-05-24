"use client";

import { useQuoteStore } from "@/store/useQuoteStore";

export default function Step1() {
  const setQuoteType = useQuoteStore((state) => state.setQuoteType);
  const nextStep = useQuoteStore((state) => state.nextStep);

  const handleSelection = (type: 'new' | 'existing') => {
    setQuoteType(type);
    nextStep();
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto mt-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Pilih Tipe Estimasi</h2>
        <p className="text-muted-foreground mt-3 text-lg">Pilih apakah Anda ingin membuat estimasi baru atau melanjutkan dari riwayat sebelumnya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handleSelection('new')}
          className="flex flex-col items-center justify-center p-10 border-2 border-border rounded-2xl hover:border-primary hover:bg-accent transition-all duration-300 group text-left h-full w-full"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-card-foreground">New Quote</h3>
          <p className="text-base text-muted-foreground text-center leading-relaxed">Membuat estimasi dari pelanggan baru atau data kosong.</p>
        </button>

        <button
          onClick={() => handleSelection('existing')}
          className="flex flex-col items-center justify-center p-10 border-2 border-border rounded-2xl hover:border-primary hover:bg-accent transition-all duration-300 group text-left h-full w-full"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-card-foreground">Existing Quote</h3>
          <p className="text-base text-muted-foreground text-center leading-relaxed">Melanjutkan proses estimasi dari riwayat yang sudah ada.</p>
        </button>
      </div>
    </div>
  );
}
