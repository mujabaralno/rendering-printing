import QuoteWizardLayout from "@/components/quote-wizard/QuoteWizardLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Quote | Smart Printing",
  description: "Buat estimasi harga untuk proyek printing Anda dengan cepat dan mudah.",
};

export default function CreateQuotePage() {
  return <QuoteWizardLayout />;
}
