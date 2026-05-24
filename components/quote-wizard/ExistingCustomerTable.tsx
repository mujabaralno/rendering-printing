"use client";

import { useState } from "react";
import { useQuoteStore } from "@/store/useQuoteStore";
import dummyData from "@/data/data-dummy.json";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ExistingCustomerTable() {
  const selectedQuoteId = useQuoteStore((state) => state.selectedQuoteId);
  const setSelectedQuote = useQuoteStore((state) => state.setSelectedQuote);
  const setCustomerData = useQuoteStore((state) => state.setCustomerData);
  const setProductDetails = useQuoteStore((state) => state.setProductDetails);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const templates = dummyData.quoteTemplates || [];
  const totalPages = Math.ceil(templates.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTemplates = templates.slice(startIndex, startIndex + itemsPerPage);

  const handleSelect = (quote: any) => {
    setSelectedQuote(quote.id);
    if (quote.clientSnapshot) {
      setCustomerData({
        firstName: quote.clientSnapshot.firstName || '',
        lastName: quote.clientSnapshot.lastName || '',
        email: quote.clientSnapshot.email || '',
        phone: quote.clientSnapshot.phone || '',
        companyName: quote.clientSnapshot.companyName || '',
        address: quote.clientSnapshot.address || '',
      });
    }

    if (quote.productsSnapshot && quote.productsSnapshot.length > 0) {
      const product = quote.productsSnapshot[0];
      
      const mappedPapers = (product.papers || []).map((p: any) => ({
        id: crypto.randomUUID(),
        paperName: p.material || p.paperName || '',
        gsm: p.gsm || ''
      }));

      const mappedFinishing: Record<string, boolean> = {};
      if (product.finishing) {
        if (product.finishing.lamination?.enabled || product.finishing.lamination === true) mappedFinishing["LAMINATION"] = true;
        if (product.finishing.uvSpot) mappedFinishing["UV SPOT"] = true;
        if (product.finishing.embossing) mappedFinishing["EMBOSSING"] = true;
        if (product.finishing.foiling) mappedFinishing["FOILING"] = true;
        if (product.finishing.dieCutting) mappedFinishing["DIE CUTTING"] = true;
        if (product.finishing.folding) mappedFinishing["FOLDING"] = true;
        if (product.finishing.varnishing) mappedFinishing["VARNISHING"] = true;
        if (product.finishing.velvetLamination?.enabled) mappedFinishing["VELVET LAMINATION"] = true;
      }

      const flatWidth = product.size?.flat?.widthCm || '';
      const flatHeight = product.size?.flat?.heightCm || '';
      const closeWidth = product.size?.close?.widthCm || '';
      const closeHeight = product.size?.close?.heightCm || '';

      setProductDetails({
        basicInfo: {
          productName: product.productName || '',
          quantity: product.quantity || '',
          sides: product.sides || '',
          printingSelection: product.printing || '',
        },
        colors: {
          frontSide: product.colors?.front || '',
          backSide: product.colors?.back || '',
        },
        sizeDetails: {
          flat: { width: flatWidth, height: flatHeight },
          close: { width: closeWidth, height: closeHeight },
          isSameAsFlat: flatWidth === closeWidth && flatHeight === closeHeight
        },
        papers: mappedPapers,
        finishing: mappedFinishing,
      });
    }
  };

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px]">Tanggal</TableHead>
            <TableHead>Nama Pelanggan</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead className="text-right">Total Harga</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTemplates.map((quote: any) => {
            const isSelected = selectedQuoteId === quote.id;
            const productName = quote.productsSnapshot?.[0]?.productName || '-';
            const totalPrice = quote.calculationSnapshot?.totalPrice || 0;
            
            return (
              <TableRow 
                key={quote.id}
                onClick={() => handleSelect(quote)}
                className={`cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary' 
                    : 'hover:bg-muted/50 border-l-2 border-l-transparent'
                }`}
              >
                <TableCell className="font-medium text-muted-foreground">
                  {quote.date}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {quote.customerName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {productName}
                </TableCell>
                <TableCell className="text-right font-medium text-foreground">
                  ${totalPrice.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}
          
          {templates.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                Tidak ada data riwayat estimasi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{startIndex + 1}</span> hingga <span className="font-medium text-foreground">{Math.min(startIndex + itemsPerPage, templates.length)}</span> dari <span className="font-medium text-foreground">{templates.length}</span> data
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 transition-colors bg-background"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 transition-colors bg-background"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
