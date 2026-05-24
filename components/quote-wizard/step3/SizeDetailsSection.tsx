"use client";

import { useQuoteStore } from "@/store/useQuoteStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SizeDetailsSection() {
  const sizeDetails = useQuoteStore((state) => state.productDetails.sizeDetails);
  const setProductDetails = useQuoteStore((state) => state.setProductDetails);

  const updateFlat = (field: 'width' | 'height', value: number | '') => {
    const newFlat = { ...sizeDetails.flat, [field]: value };
    const newClose = sizeDetails.isSameAsFlat ? { ...newFlat } : sizeDetails.close;
    setProductDetails({
      sizeDetails: { ...sizeDetails, flat: newFlat, close: newClose }
    });
  };

  const updateClose = (field: 'width' | 'height', value: number | '') => {
    if (sizeDetails.isSameAsFlat) return;
    setProductDetails({
      sizeDetails: { ...sizeDetails, close: { ...sizeDetails.close, [field]: value } }
    });
  };

  const toggleSameAsFlat = (checked: boolean) => {
    setProductDetails({
      sizeDetails: {
        ...sizeDetails,
        isSameAsFlat: checked,
        close: checked ? { ...sizeDetails.flat } : sizeDetails.close
      }
    });
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl">3. Size Details (cm)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Flat Size */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Flat Size</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input 
                type="number" 
                placeholder="0.0" 
                value={sizeDetails.flat.width}
                onChange={(e) => updateFlat('width', e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <Input 
                type="number" 
                placeholder="0.0" 
                value={sizeDetails.flat.height}
                onChange={(e) => updateFlat('height', e.target.value ? Number(e.target.value) : '')}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="sameAsFlat" 
            checked={sizeDetails.isSameAsFlat}
            onCheckedChange={toggleSameAsFlat}
          />
          <Label htmlFor="sameAsFlat" className="cursor-pointer font-normal text-muted-foreground">
            Use same dimensions as Flat size
          </Label>
        </div>

        {/* Close Size */}
        <div className={sizeDetails.isSameAsFlat ? 'opacity-50 pointer-events-none' : ''}>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Close Size</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input 
                type="number" 
                placeholder="0.0" 
                value={sizeDetails.close.width}
                onChange={(e) => updateClose('width', e.target.value ? Number(e.target.value) : '')}
                disabled={sizeDetails.isSameAsFlat}
              />
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <Input 
                type="number" 
                placeholder="0.0" 
                value={sizeDetails.close.height}
                onChange={(e) => updateClose('height', e.target.value ? Number(e.target.value) : '')}
                disabled={sizeDetails.isSameAsFlat}
              />
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
