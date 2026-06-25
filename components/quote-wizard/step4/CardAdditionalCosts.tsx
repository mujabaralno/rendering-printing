"use client";

import { useState } from "react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardAdditionalCosts() {
  const addlCosts = useQuoteStore((state) => state.operationalDetails.additionalCosts);
  const addCustomCost = useQuoteStore((state) => state.addCustomCost);
  const updateCustomCost = useQuoteStore((state) => state.updateCustomCost);
  const removeCustomCost = useQuoteStore((state) => state.removeCustomCost);

  const handleAddCost = () => {
    addCustomCost({
      id: crypto.randomUUID(),
      description: "",
      amount: "",
      comment: ""
    });
  };

  return (
    <Card className="border-border shadow-sm flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="flex items-center gap-2.5 text-foreground text-base">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">C</span>
          Additional Costs
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 flex-1 overflow-y-auto max-h-[500px]">
        
        {/* Production Costs */}
        <div className="grid grid-cols-3 gap-2 bg-muted/20 p-2 rounded border border-border/50">
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Plates</div>
            <div className="font-medium text-sm">{addlCosts.productionCosts.plates}</div>
          </div>
          <div className="text-center border-x border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Units</div>
            <div className="font-medium text-sm">{addlCosts.productionCosts.units}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Impressions</div>
            <div className="font-medium text-sm">{addlCosts.productionCosts.impressions}</div>
          </div>
        </div>

        {/* Unique Project Costs */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Unique Project Costs</Label>
            <button 
              onClick={handleAddCost}
              className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded shadow-sm hover:bg-primary/90 transition-colors"
            >
              + Add Cost
            </button>
          </div>
          
          <div className="space-y-3">
            {addlCosts.customCosts.map((cost) => (
              <div key={cost.id} className="p-3 bg-muted/10 border border-border rounded-lg relative group">
                <button 
                  onClick={() => removeCustomCost(cost.id)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  &times;
                </button>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="col-span-2">
                    <Input 
                      placeholder="Description" 
                      value={cost.description} 
                      onChange={(e) => updateCustomCost(cost.id, { description: e.target.value })}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Input 
                      type="number"
                      placeholder="Amount" 
                      value={cost.amount} 
                      onChange={(e) => updateCustomCost(cost.id, { amount: e.target.value ? Number(e.target.value) : '' })}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] text-muted-foreground">Comment</span>
                    <span className="text-[10px] text-destructive font-bold">⚠️ Required</span>
                  </div>
                  <Input 
                    placeholder="Mandatory comment" 
                    value={cost.comment} 
                    onChange={(e) => updateCustomCost(cost.id, { comment: e.target.value })}
                    className={`h-7 text-xs ${!cost.comment ? 'border-destructive/50 focus-visible:ring-destructive/30' : ''}`}
                  />
                </div>
              </div>
            ))}
            {addlCosts.customCosts.length === 0 && (
              <div className="text-xs text-center text-muted-foreground py-4 border border-dashed border-border rounded">
                No unique costs added.
              </div>
            )}
          </div>
        </div>

        {/* Finishing Costs */}
        <div className="mt-auto pt-4 border-t border-border">
          <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2 block">Finishing</Label>
          <div className="flex items-center justify-between bg-card border border-border p-3 rounded-lg">
            <span className="text-sm font-medium">Finishing Costs Summary</span>
            <button className="text-xs text-primary font-semibold hover:underline">
              View Details
            </button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
