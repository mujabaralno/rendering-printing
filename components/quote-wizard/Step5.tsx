"use client";

import { useEffect, useState } from "react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { generateQuotationPdf } from "@/utils/generatePdf";

export default function Step5() {
  const prevStep = useQuoteStore((state) => state.prevStep);
  const customerData = useQuoteStore((state) => state.customerData);
  const opDetails = useQuoteStore((state) => state.operationalDetails);
  const discountDetails = useQuoteStore((state) => state.discountDetails);
  const calculationSnapshot = useQuoteStore((state) => state.calculationSnapshot);
  
  const setDiscountDetails = useQuoteStore((state) => state.setDiscountDetails);
  const setCalculationSnapshot = useQuoteStore((state) => state.setCalculationSnapshot);
  const saveQuote = useQuoteStore((state) => state.saveQuote);
  const isSaving = useQuoteStore((state) => state.isSaving);
  const isSaved = useQuoteStore((state) => state.isSaved);
  const resetSaveState = useQuoteStore((state) => state.resetSaveState);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 1. Calculate Subtotal from Step 4 data
  useEffect(() => {
    // Paper Cost
    const sheets = Number(opDetails.paperDetails.enteredSheets) || opDetails.paperDetails.recommendedSheets || 0;
    const pricePerSheet = Number(opDetails.paperPricing.pricePerSheet) || 0;
    const paperCost = sheets * pricePerSheet;

    // Custom Costs
    const customCosts = opDetails.additionalCosts.customCosts.reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0);

    // Production Costs (Mock values for simulation since prices aren't in state)
    const platesCost = opDetails.additionalCosts.productionCosts.plates * 50000;
    const unitsCost = opDetails.additionalCosts.productionCosts.units * 10000;
    const impressionsCost = (opDetails.additionalCosts.productionCosts.impressions / 1000) * 15000;
    const productionTotal = platesCost + unitsCost + impressionsCost;

    const calculatedSubtotal = paperCost + customCosts + productionTotal;

    // Only update if changed
    if (calculatedSubtotal !== calculationSnapshot.subtotal) {
      setCalculationSnapshot({ subtotal: calculatedSubtotal });
    }
  }, [opDetails, calculationSnapshot.subtotal, setCalculationSnapshot]);

  // 2. Reactive calculations for Discount, Tax, and Final Total
  useEffect(() => {
    let discountAmount = 0;
    if (discountDetails.isApplied && discountDetails.percentage !== '') {
      discountAmount = (calculationSnapshot.subtotal * Number(discountDetails.percentage)) / 100;
    }
    
    // Update discount amount in store
    if (discountAmount !== discountDetails.amount) {
      setDiscountDetails({ amount: discountAmount });
    }

    const finalSubtotal = Math.max(0, calculationSnapshot.subtotal - discountAmount);
    const vatAmount = (finalSubtotal * calculationSnapshot.vatPercentage) / 100;
    const totalPrice = finalSubtotal + vatAmount;

    setCalculationSnapshot({
      finalSubtotal,
      vatAmount,
      totalPrice
    });
  }, [
    calculationSnapshot.subtotal, 
    discountDetails.isApplied, 
    discountDetails.percentage, 
    calculationSnapshot.vatPercentage,
    setDiscountDetails,
    setCalculationSnapshot
  ]);

  // Handle Save
  const handleSave = async () => {
    await saveQuote();
    setShowSuccessModal(true);
  };

  // Format Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleDownloadPdf = (type: 'customer' | 'ops') => {
    generateQuotationPdf({
      type,
      customerData: useQuoteStore.getState().customerData,
      productDetails: useQuoteStore.getState().productDetails,
      opDetails: useQuoteStore.getState().operationalDetails,
      calculationSnapshot: useQuoteStore.getState().calculationSnapshot,
      discountDetails: useQuoteStore.getState().discountDetails,
    });
  };

  return (
    <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Quotation Summary
        </h2>
        <p className="text-muted-foreground mt-2 text-lg">
          Tinjauan akhir kutipan harga sebelum disimpan dan diterbitkan.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* LEFT COLUMN */}
          <div className="space-y-10">
            {/* Section 1: Quote To */}
            <section>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">
                Quote To
              </h3>
              <div className="bg-muted/30 p-5 rounded-lg border border-border">
                <h4 className="text-lg font-bold text-foreground mb-1">
                  {customerData.companyName || "Personal Customer"}
                </h4>
                <p className="text-md font-medium text-foreground mb-3">
                  {customerData.firstName} {customerData.lastName}
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span>{customerData.phone || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                    <span>{customerData.email || "-"}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <svg className="w-4 h-4 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span className="leading-snug">{customerData.address || "-"}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Discount Management */}
            <section>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">
                Discount Management
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-muted/20 border border-border rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-primary/50 checked:border-primary checked:bg-primary transition-all"
                      checked={discountDetails.isApplied}
                      onChange={(e) => setDiscountDetails({ isApplied: e.target.checked })}
                    />
                    <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-primary-foreground stroke-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="font-medium text-foreground select-none">Apply Special Discount</span>
                </label>

                {discountDetails.isApplied && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Discount (%)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                            value={discountDetails.percentage}
                            onChange={(e) => setDiscountDetails({ percentage: e.target.value === '' ? '' : Number(e.target.value) })}
                            placeholder="e.g. 10"
                          />
                          <span className="absolute right-3 top-2.5 text-muted-foreground text-sm font-bold">%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Discount Amount</label>
                        <div className="w-full bg-background/50 border border-border rounded-md px-3 py-2 text-sm text-foreground font-medium flex items-center justify-between">
                          <span>-</span>
                          <span className="text-destructive font-bold">{formatCurrency(discountDetails.amount)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Reason for Discount</label>
                      <input 
                        type="text"
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                        value={discountDetails.reason}
                        onChange={(e) => setDiscountDetails({ reason: e.target.value })}
                        placeholder="e.g. Returning customer, Bulk order..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-10">
            {/* Section 3: Price Summary */}
            <section>
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">
                Price Summary
              </h3>
              
              <div className="bg-muted/10 border border-border rounded-xl p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10"></div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal (Operations)</span>
                  <span className="text-foreground font-semibold">{formatCurrency(calculationSnapshot.subtotal)}</span>
                </div>
                
                {discountDetails.isApplied && discountDetails.amount > 0 && (
                  <div className="flex justify-between items-center text-sm animate-in fade-in duration-300">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      Discount <span className="bg-destructive/10 text-destructive text-[10px] px-1.5 py-0.5 rounded font-bold">{discountDetails.percentage}%</span>
                    </span>
                    <span className="text-destructive font-bold">-{formatCurrency(discountDetails.amount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-sm pt-3 border-t border-border/50">
                  <span className="text-muted-foreground font-medium">Final Subtotal</span>
                  <span className="text-foreground font-semibold">{formatCurrency(calculationSnapshot.finalSubtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">VAT / Tax</span>
                    <div className="flex items-center bg-background border border-border rounded overflow-hidden">
                      <input 
                        type="number" 
                        value={calculationSnapshot.vatPercentage}
                        onChange={(e) => setCalculationSnapshot({ vatPercentage: Number(e.target.value) || 0 })}
                        className="w-12 px-1 py-0.5 text-xs text-center outline-none bg-transparent"
                      />
                      <span className="bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground">%</span>
                    </div>
                  </div>
                  <span className="text-foreground font-semibold">{formatCurrency(calculationSnapshot.vatAmount)}</span>
                </div>
                
                <div className="pt-4 border-t-2 border-border/80 mt-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-sm font-bold text-muted-foreground uppercase">Grand Total</span>
                      <p className="text-xs text-muted-foreground mt-1">IDR (Includes Tax)</p>
                    </div>
                    <span className="text-3xl font-black text-primary tracking-tight">
                      {formatCurrency(calculationSnapshot.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Section 4: Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
        <button
          onClick={prevStep}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-2.5 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted hover:text-foreground transition-colors shadow-sm disabled:opacity-50"
        >
          Kembali
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadPdf('customer')}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm border border-border/50"
              title="Customer Copy (No internal costs)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Customer PDF
            </button>
            <button
              onClick={() => handleDownloadPdf('ops')}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors shadow-sm border border-border/50"
              title="Operations Copy (With margins & costs)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Ops PDF
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-70 disabled:cursor-wait"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                SAVING...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                SAVE QUOTE
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border shadow-2xl rounded-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Quote Saved!</h3>
            <p className="text-muted-foreground mb-8">
              Data penawaran harga telah berhasil disimpan ke sistem.
            </p>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                resetSaveState();
                // We could reset the wizard here if needed:
                // useQuoteStore.getState().setStep(1);
              }}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
