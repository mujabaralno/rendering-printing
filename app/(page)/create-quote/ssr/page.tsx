import QuoteWizardLayout from "@/components/quote-wizard/QuoteWizardLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Quote (SSR) | Smart Printing",
  description: "Buat estimasi harga untuk proyek printing Anda — algoritma dieksekusi di server.",
};

export default function CreateQuoteSSRPage() {
  return <QuoteWizardLayout />;
}
