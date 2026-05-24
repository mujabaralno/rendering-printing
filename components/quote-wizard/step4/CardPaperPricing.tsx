"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardPaperPricing() {
  const pricing = useQuoteStore((state) => state.operationalDetails.paperPricing);
  const setOpDetails = useQuoteStore((state) => state.setOperationalDetails);

  const updateField = (field: string, value: any) => {
    setOpDetails({
      paperPricing: { ...pricing, [field]: value }
    });
  };

  // Mock excel-based calc
  const paperCost = (Number(pricing.pricePerSheet) || 0) * 1000; // mock calculation
  const plateCost = 4 * 15; // mock 4 plates * 15
  const offsetTotal = paperCost + plateCost;
  const unitPrice = offsetTotal / 1000;

  return (
    <Card className="border-border shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="text-foreground text-lg">B. Paper Pricing</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 flex-1">
        
        <div className="space-y-1">
          <Label className="text-xs">Price per Sheet ($)</Label>
          <Input 
            type="number" 
            value={pricing.pricePerSheet} 
            onChange={(e) => updateField('pricePerSheet', e.target.value ? Number(e.target.value) : '')}
            className="h-8"
          />
        </div>

        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
          <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 block">Packet Pricing</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Sheets/Packet</Label>
              <Input 
                type="number" 
                value={pricing.sheetsPerPacket} 
                onChange={(e) => updateField('sheetsPerPacket', e.target.value ? Number(e.target.value) : '')}
                className="h-8 bg-background"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price/Packet</Label>
              <Input 
                type="number" 
                value={pricing.pricePerPacket} 
                onChange={(e) => updateField('pricePerPacket', e.target.value ? Number(e.target.value) : '')}
                className="h-8 bg-background"
              />
            </div>
          </div>
        </div>

        {/* Excel Summary */}
        <div className="mt-auto pt-4 border-t border-border">
          <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-3 block">Excel Summary</Label>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paper Cost:</span>
              <span className="font-medium">${paperCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plate Cost (4 cols):</span>
              <span className="font-medium">${plateCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
              <span className="text-foreground font-medium">Offset Total:</span>
              <span className="font-bold text-primary">${offsetTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between bg-primary/10 px-2 py-1 rounded">
              <span className="text-primary font-medium text-xs">Est. Unit Price:</span>
              <span className="font-bold text-primary text-xs">${unitPrice.toFixed(4)}</span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
