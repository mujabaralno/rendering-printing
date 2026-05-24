"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ColorOptionsSection() {
  const colors = useQuoteStore((state) => state.productDetails.colors);
  const setProductDetails = useQuoteStore((state) => state.setProductDetails);

  const updateField = (field: string, value: any) => {
    setProductDetails({
      colors: { ...colors, [field]: value }
    });
  };

  const colorOptions = [
    "CMYK", "Black Only", "Pantone 1 Color", "Pantone 2 Colors", "None"
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl">2. Color Options</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Front Side</Label>
          <Select value={colors.frontSide} onValueChange={(val) => updateField('frontSide', val)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select front color" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((opt) => (
                <SelectItem key={`front-${opt}`} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Back Side</Label>
          <Select value={colors.backSide} onValueChange={(val) => updateField('backSide', val)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select back color" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((opt) => (
                <SelectItem key={`back-${opt}`} value={opt}>{opt}</SelectItem>
              ))}
              <SelectItem value="SameAsFront">Same as Front</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
