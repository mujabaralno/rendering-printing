"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BasicInfoSection() {
  const basicInfo = useQuoteStore((state) => state.productDetails.basicInfo);
  const setProductDetails = useQuoteStore((state) => state.setProductDetails);

  const updateField = (field: string, value: any) => {
    setProductDetails({
      basicInfo: { ...basicInfo, [field]: value }
    });
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl">1. Basic Info</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="productName">Product Name</Label>
          <Input 
            id="productName" 
            placeholder="e.g. Business Card, Brochure" 
            value={basicInfo.productName}
            onChange={(e) => updateField('productName', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input 
            id="quantity" 
            type="number" 
            min="1"
            placeholder="e.g. 1000" 
            value={basicInfo.quantity}
            onChange={(e) => updateField('quantity', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
        <div className="space-y-2">
          <Label>Sides</Label>
          <Select value={String(basicInfo.sides)} onValueChange={(val) => updateField('sides', Number(val))}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select sides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Side (Single Sided)</SelectItem>
              <SelectItem value="2">2 Sides (Double Sided)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Printing Selection</Label>
          <Select value={basicInfo.printingSelection} onValueChange={(val) => updateField('printingSelection', val)}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select printing type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Offset">Offset</SelectItem>
              <SelectItem value="Digital">Digital</SelectItem>
              <SelectItem value="Screen Print">Screen Print</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
