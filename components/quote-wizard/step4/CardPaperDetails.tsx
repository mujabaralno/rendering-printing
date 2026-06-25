"use client";

import { useState } from "react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardPaperDetails() {
  const opDetails = useQuoteStore((state) => state.operationalDetails.paperDetails);
  const setOpDetails = useQuoteStore((state) => state.setOperationalDetails);
  const sizeDetails = useQuoteStore((state) => state.productDetails.sizeDetails);

  const [newColor, setNewColor] = useState("");

  const updateField = (field: string, value: any) => {
    setOpDetails({
      paperDetails: { ...opDetails, [field]: value }
    });
  };

  const handleAddColor = () => {
    if (newColor.trim()) {
      updateField("colorCodes", [...opDetails.colorCodes, newColor.trim()]);
      setNewColor("");
    }
  };

  const outputWidth = sizeDetails.isSameAsFlat ? sizeDetails.flat.width : sizeDetails.close.width;
  const outputHeight = sizeDetails.isSameAsFlat ? sizeDetails.flat.height : sizeDetails.close.height;

  return (
    <Card className="border-border shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="flex items-center gap-2.5 text-foreground text-base">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">A</span>
          Paper Details
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 flex-1">
        
        {/* Sheet Size */}
        <div>
          <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 block">Input Sheet Size (cm)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Width</Label>
              <Input 
                type="number" 
                value={opDetails.inputSheetWidth} 
                onChange={(e) => updateField('inputSheetWidth', e.target.value ? Number(e.target.value) : '')}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Height</Label>
              <Input 
                type="number" 
                value={opDetails.inputSheetHeight} 
                onChange={(e) => updateField('inputSheetHeight', e.target.value ? Number(e.target.value) : '')}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Output Size */}
        <div>
          <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 block">Output Item Size (cm)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Width</Label>
              <Input type="number" value={outputWidth} disabled className="h-8 bg-muted/50" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Height</Label>
              <Input type="number" value={outputHeight} disabled className="h-8 bg-muted/50" />
            </div>
          </div>
        </div>

        {/* Sheet Management */}
        <div>
          <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 block">Sheet Management</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-primary">Recommended</Label>
              <Input type="number" value={opDetails.recommendedSheets} disabled className="h-8 bg-primary/5 border-primary/20 text-primary font-medium" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Entered</Label>
              <Input 
                type="number" 
                value={opDetails.enteredSheets} 
                onChange={(e) => updateField('enteredSheets', e.target.value ? Number(e.target.value) : '')}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Colors */}
        <div>
          <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 block">Color Codes</Label>
          <div className="flex gap-2 mb-2">
            <Input 
              placeholder="e.g. #FF0000, Pantone 123" 
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
              className="h-8"
            />
            <button 
              onClick={handleAddColor}
              className="px-3 bg-secondary text-secondary-foreground rounded text-xs font-medium hover:bg-secondary/80 transition-colors border border-border"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {opDetails.colorCodes.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs">
                {c}
                <button 
                  onClick={() => updateField('colorCodes', opDetails.colorCodes.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
