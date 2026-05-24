"use client";

import { useState } from "react";
import { useQuoteStore, PaperDetail } from "@/store/useQuoteStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaperDetailsSection() {
  const papers = useQuoteStore((state) => state.productDetails.papers);
  const setProductDetails = useQuoteStore((state) => state.setProductDetails);

  const [tempName, setTempName] = useState("");
  const [tempGsm, setTempGsm] = useState<number | "">("");

  const handleAddPaper = () => {
    if (!tempName.trim()) return;
    
    const newPaper: PaperDetail = {
      id: crypto.randomUUID(),
      paperName: tempName,
      gsm: tempGsm,
    };

    setProductDetails({ papers: [...papers, newPaper] });
    setTempName("");
    setTempGsm("");
  };

  const handleRemovePaper = (id: string) => {
    setProductDetails({ papers: papers.filter(p => p.id !== id) });
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-xl">4. Paper Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="space-y-2 flex-1 w-full">
            <Label htmlFor="paperName">Paper Name</Label>
            <Input 
              id="paperName" 
              placeholder="e.g. Art Carton, HVS" 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
            />
          </div>
          <div className="space-y-2 w-full md:w-32">
            <Label htmlFor="gsm">GSM</Label>
            <Input 
              id="gsm" 
              type="number" 
              placeholder="e.g. 260" 
              value={tempGsm}
              onChange={(e) => setTempGsm(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <button
            onClick={handleAddPaper}
            disabled={!tempName.trim()}
            className="px-4 py-2.5 bg-secondary text-secondary-foreground border border-border rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto shrink-0"
          >
            + ADD PAPER
          </button>
        </div>

        {papers.length > 0 && (
          <div className="mt-4 border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Paper Name</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground w-24">GSM</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {papers.map((paper) => (
                  <tr key={paper.id} className="bg-card hover:bg-muted/30">
                    <td className="px-4 py-3 text-foreground font-medium">{paper.paperName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{paper.gsm || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleRemovePaper(paper.id)}
                        className="text-destructive hover:text-destructive/80 font-medium text-xs bg-destructive/10 px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
