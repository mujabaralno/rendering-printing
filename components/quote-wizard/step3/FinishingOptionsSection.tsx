"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FINISHING_OPTIONS = [
  "EMBOSSING",
  "LAMINATION",
  "VELVET LAMINATION",
  "FOILING",
  "DIE CUTTING",
  "UV SPOT",
  "FOLDING",
  "VARNISHING"
];

export default function FinishingOptionsSection() {
  const finishing = useQuoteStore((state) => state.productDetails.finishing);
  const setProductDetails = useQuoteStore((state) => state.setProductDetails);

  const toggleOption = (option: string, checked: boolean) => {
    setProductDetails({
      finishing: { ...finishing, [option]: checked }
    });
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl">5. Finishing Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {FINISHING_OPTIONS.map((option) => (
            <div key={option} className="flex items-center space-x-3 bg-muted/20 border border-border p-3 rounded-lg hover:bg-muted/40 transition-colors">
              <Checkbox 
                id={`finish-${option}`} 
                checked={!!finishing[option]}
                onCheckedChange={(checked) => toggleOption(option, checked as boolean)}
              />
              <Label 
                htmlFor={`finish-${option}`} 
                className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
