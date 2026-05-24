import { create } from 'zustand';

export type QuoteType = 'new' | 'existing' | null;

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
}

export interface PaperDetail {
  id: string;
  paperName: string;
  gsm: number | '';
}

export interface SizeDetails {
  flat: { width: number | ''; height: number | '' };
  close: { width: number | ''; height: number | '' };
  isSameAsFlat: boolean;
}

export interface ProductDetails {
  basicInfo: {
    productName: string;
    quantity: number | '';
    sides: number | '';
    printingSelection: string;
  };
  colors: {
    frontSide: string;
    backSide: string;
  };
  sizeDetails: SizeDetails;
  papers: PaperDetail[];
  finishing: Record<string, boolean>;
}

export interface CustomCost {
  id: string;
  description: string;
  amount: number | '';
  comment: string;
}

export interface OperationalDetails {
  paperDetails: {
    inputSheetWidth: number | '';
    inputSheetHeight: number | '';
    recommendedSheets: number;
    enteredSheets: number | '';
    colorCodes: string[];
  };
  paperPricing: {
    pricePerSheet: number | '';
    sheetsPerPacket: number | '';
    pricePerPacket: number | '';
  };
  additionalCosts: {
    customCosts: CustomCost[];
    productionCosts: {
      plates: number;
      units: number;
      impressions: number;
    };
  };
}

export interface DiscountDetails {
  isApplied: boolean;
  percentage: number | '';
  amount: number;
  reason: string;
}

export interface CalculationSnapshot {
  subtotal: number;
  finalSubtotal: number;
  vatPercentage: number;
  vatAmount: number;
  totalPrice: number;
}

interface QuoteStore {
  currentStep: number;
  quoteType: QuoteType;
  customerData: CustomerData;
  selectedQuoteId: string | null;
  productDetails: ProductDetails;
  operationalDetails: OperationalDetails;
  discountDetails: DiscountDetails;
  calculationSnapshot: CalculationSnapshot;
  isSaving: boolean;
  isSaved: boolean;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setQuoteType: (type: QuoteType) => void;
  setCustomerData: (data: Partial<CustomerData>) => void;
  setSelectedQuote: (id: string | null) => void;
  setProductDetails: (data: Partial<ProductDetails>) => void;
  setOperationalDetails: (data: Partial<OperationalDetails>) => void;
  addCustomCost: (cost: CustomCost) => void;
  updateCustomCost: (id: string, cost: Partial<CustomCost>) => void;
  removeCustomCost: (id: string) => void;
  setDiscountDetails: (data: Partial<DiscountDetails>) => void;
  setCalculationSnapshot: (data: Partial<CalculationSnapshot>) => void;
  saveQuote: () => Promise<void>;
  resetSaveState: () => void;
}

const defaultCustomerData: CustomerData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  address: '',
};

const defaultProductDetails: ProductDetails = {
  basicInfo: {
    productName: '',
    quantity: '',
    sides: '',
    printingSelection: '',
  },
  colors: {
    frontSide: '',
    backSide: '',
  },
  sizeDetails: {
    flat: { width: '', height: '' },
    close: { width: '', height: '' },
    isSameAsFlat: true,
  },
  papers: [],
  finishing: {},
};

const defaultOperationalDetails: OperationalDetails = {
  paperDetails: {
    inputSheetWidth: 100,
    inputSheetHeight: 70,
    recommendedSheets: 0,
    enteredSheets: '',
    colorCodes: [],
  },
  paperPricing: {
    pricePerSheet: '',
    sheetsPerPacket: '',
    pricePerPacket: '',
  },
  additionalCosts: {
    customCosts: [],
    productionCosts: {
      plates: 4,
      units: 1,
      impressions: 1000,
    },
  },
};

const defaultDiscountDetails: DiscountDetails = {
  isApplied: false,
  percentage: '',
  amount: 0,
  reason: '',
};

const defaultCalculationSnapshot: CalculationSnapshot = {
  subtotal: 0,
  finalSubtotal: 0,
  vatPercentage: 5,
  vatAmount: 0,
  totalPrice: 0,
};

export const useQuoteStore = create<QuoteStore>((set) => ({
  currentStep: 1,
  quoteType: null,
  customerData: defaultCustomerData,
  selectedQuoteId: null,
  productDetails: defaultProductDetails,
  operationalDetails: defaultOperationalDetails,
  discountDetails: defaultDiscountDetails,
  calculationSnapshot: defaultCalculationSnapshot,
  isSaving: false,
  isSaved: false,
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  setQuoteType: (type) => set({ quoteType: type }),
  setCustomerData: (data) => set((state) => ({ customerData: { ...state.customerData, ...data } })),
  setSelectedQuote: (id) => set({ selectedQuoteId: id }),
  setProductDetails: (data) => set((state) => ({ productDetails: { ...state.productDetails, ...data } })),
  setOperationalDetails: (data) => set((state) => ({ 
    operationalDetails: { ...state.operationalDetails, ...data } 
  })),
  addCustomCost: (cost) => set((state) => ({
    operationalDetails: {
      ...state.operationalDetails,
      additionalCosts: {
        ...state.operationalDetails.additionalCosts,
        customCosts: [...state.operationalDetails.additionalCosts.customCosts, cost]
      }
    }
  })),
  updateCustomCost: (id, newCost) => set((state) => ({
    operationalDetails: {
      ...state.operationalDetails,
      additionalCosts: {
        ...state.operationalDetails.additionalCosts,
        customCosts: state.operationalDetails.additionalCosts.customCosts.map(c => 
          c.id === id ? { ...c, ...newCost } : c
        )
      }
    }
  })),
  removeCustomCost: (id) => set((state) => ({
    operationalDetails: {
      ...state.operationalDetails,
      additionalCosts: {
        ...state.operationalDetails.additionalCosts,
        customCosts: state.operationalDetails.additionalCosts.customCosts.filter(c => c.id !== id)
      }
    }
  })),
  setDiscountDetails: (data) => set((state) => ({
    discountDetails: { ...state.discountDetails, ...data }
  })),
  setCalculationSnapshot: (data) => set((state) => ({
    calculationSnapshot: { ...state.calculationSnapshot, ...data }
  })),
  saveQuote: async () => {
    set({ isSaving: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    set({ isSaving: false, isSaved: true });
  },
  resetSaveState: () => set({ isSaved: false }),
}));

