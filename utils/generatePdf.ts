import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerData, ProductDetails, OperationalDetails, CalculationSnapshot, DiscountDetails } from '@/store/useQuoteStore';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

interface PdfOptions {
  type: 'customer' | 'ops';
  customerData: CustomerData;
  productDetails: ProductDetails;
  opDetails: OperationalDetails;
  calculationSnapshot: CalculationSnapshot;
  discountDetails: DiscountDetails;
}

export const generateQuotationPdf = ({
  type,
  customerData,
  productDetails,
  opDetails,
  calculationSnapshot,
  discountDetails,
}: PdfOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 20;

  const addSectionTitle = (title: string) => {
    // Check page break
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185); // Blue color for section titles
    doc.text(title, 14, currentY);
    currentY += 2;
    doc.setDrawColor(41, 128, 185);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 6;
  };

  // ====================================================
  // HEADER
  // ====================================================
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  const docTitle = type === 'ops' ? 'OPERATIONAL QUOTATION' : 'QUOTATION';
  doc.text(docTitle, 14, currentY);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('id-ID')}`, 14, currentY + 8);
  doc.text(`Quote Ref: QTE-${Math.floor(1000 + Math.random() * 9000)}`, 14, currentY + 13);

  // Company Info (Right aligned)
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Smart Printing', pageWidth - 14, currentY, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Jl. Percetakan Negara No. 123', pageWidth - 14, currentY + 6, { align: 'right' });
  doc.text('Jakarta Pusat, 10570', pageWidth - 14, currentY + 11, { align: 'right' });
  doc.text('Phone: (021) 123-4567', pageWidth - 14, currentY + 16, { align: 'right' });
  
  currentY += 28;

  // ====================================================
  // 1. CLIENT INFORMATION
  // ====================================================
  addSectionTitle('1. CLIENT INFORMATION');
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(customerData.companyName || `${customerData.firstName} ${customerData.lastName}`, 14, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  if (customerData.companyName) {
    currentY += 5;
    doc.text(`Attn: ${customerData.firstName} ${customerData.lastName}`, 14, currentY);
  }
  currentY += 5;
  doc.text(`Phone: ${customerData.phone || '-'}`, 14, currentY);
  currentY += 5;
  doc.text(`Email: ${customerData.email || '-'}`, 14, currentY);
  currentY += 5;
  doc.text(`Address: ${customerData.address || '-'}`, 14, currentY);

  currentY += 12;

  // ====================================================
  // 2. PRODUCT SPECIFICATIONS
  // ====================================================
  addSectionTitle('2. PRODUCT SPECIFICATIONS');

  const activeFinishing = Object.entries(productDetails.finishing)
    .filter(([_, isActive]) => isActive)
    .map(([key]) => key);

  const prodSpecs = [
    ['Product Name', productDetails.basicInfo.productName || '-'],
    ['Quantity', productDetails.basicInfo.quantity.toString() || '-'],
    ['Sides', productDetails.basicInfo.sides.toString() || '-'],
    ['Size (Flat)', `${productDetails.sizeDetails.flat.width} x ${productDetails.sizeDetails.flat.height} cm`],
    ['Colors', `Front: ${productDetails.colors.frontSide} / Back: ${productDetails.colors.backSide}`],
    ['Finishing', activeFinishing.length > 0 ? activeFinishing.join(', ') : '-']
  ];

  autoTable(doc, {
    startY: currentY,
    body: prodSpecs,
    theme: 'plain',
    styles: { cellPadding: 1, fontSize: 10, textColor: [50, 50, 50] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
    },
    margin: { left: 14, right: 14 }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // ====================================================
  // 3. PRICING BREAKDOWN
  // ====================================================
  addSectionTitle('3. PRICING BREAKDOWN');

  const breakdownData: any[] = [];
  
  if (type === 'ops') {
    // Ops sees detailed internal costs
    const sheets = Number(opDetails.paperDetails.enteredSheets) || opDetails.paperDetails.recommendedSheets || 0;
    const pricePerSheet = Number(opDetails.paperPricing.pricePerSheet) || 0;
    const paperCost = sheets * pricePerSheet;

    const platesCost = opDetails.additionalCosts.productionCosts.plates * 50000;
    const unitsCost = opDetails.additionalCosts.productionCosts.units * 10000;
    const impressionsCost = (opDetails.additionalCosts.productionCosts.impressions / 1000) * 15000;

    breakdownData.push(['Paper Cost', `${sheets} sheets @ ${formatCurrency(pricePerSheet)}`, formatCurrency(paperCost)]);
    breakdownData.push(['Production (Plates)', `${opDetails.additionalCosts.productionCosts.plates} plates`, formatCurrency(platesCost)]);
    breakdownData.push(['Production (Units)', `${opDetails.additionalCosts.productionCosts.units} units`, formatCurrency(unitsCost)]);
    breakdownData.push(['Production (Impressions)', `${opDetails.additionalCosts.productionCosts.impressions} imp.`, formatCurrency(impressionsCost)]);

    opDetails.additionalCosts.customCosts.forEach(cost => {
      breakdownData.push([cost.description, cost.comment || '-', formatCurrency(Number(cost.amount))]);
    });
  } else {
    // Customer sees generic breakdown
    breakdownData.push(['Printing & Production', `Base production cost for ${productDetails.basicInfo.productName}`, formatCurrency(calculationSnapshot.subtotal)]);
    // Customers typically don't see raw custom costs unbundled unless specified, but if we want to show it:
    // We will just show the total subtotal as "Printing Services" to keep it clean.
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Item Description', 'Details', 'Amount']],
    body: breakdownData,
    theme: 'striped',
    headStyles: { fillColor: type === 'ops' ? [192, 57, 43] : [149, 165, 166] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      2: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // ====================================================
  // 4. PAPER SPECIFICATIONS
  // ====================================================
  addSectionTitle('4. PAPER SPECIFICATIONS');

  const paperSpecs: any[] = [];
  
  if (productDetails.papers.length > 0) {
    productDetails.papers.forEach(p => {
      paperSpecs.push(['Selected Material', `${p.paperName} ${p.gsm ? `(${p.gsm} GSM)` : ''}`]);
    });
  } else {
    paperSpecs.push(['Selected Material', '-']);
  }

  if (type === 'ops') {
    paperSpecs.push(['Plano/Input Size', `${opDetails.paperDetails.inputSheetWidth} x ${opDetails.paperDetails.inputSheetHeight} cm`]);
    paperSpecs.push(['Req. Sheets (Plano)', (Number(opDetails.paperDetails.enteredSheets) || opDetails.paperDetails.recommendedSheets || 0).toString()]);
  }

  autoTable(doc, {
    startY: currentY,
    body: paperSpecs,
    theme: 'plain',
    styles: { cellPadding: 1, fontSize: 10, textColor: [50, 50, 50] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
    },
    margin: { left: 14, right: 14 }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // ====================================================
  // 5. PRICING SUMMARY
  // ====================================================
  addSectionTitle('5. PRICING SUMMARY');

  const financialData: string[][] = [
    ['Subtotal', formatCurrency(calculationSnapshot.subtotal)]
  ];

  if (discountDetails.isApplied && discountDetails.amount > 0) {
    financialData.push([`Discount (${discountDetails.percentage}%)`, `-${formatCurrency(discountDetails.amount)}`]);
    financialData.push(['Final Subtotal', formatCurrency(calculationSnapshot.finalSubtotal)]);
  }

  if (calculationSnapshot.vatAmount > 0) {
    financialData.push([`VAT (${calculationSnapshot.vatPercentage}%)`, formatCurrency(calculationSnapshot.vatAmount)]);
  }

  // Ensure it doesn't break to a new page awkwardly
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }

  autoTable(doc, {
    startY: currentY,
    body: financialData,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'right' },
      1: { halign: 'right', cellWidth: 50 }
    },
    margin: { left: pageWidth / 2, right: 14 } // Align to right
  });

  currentY = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: currentY,
    body: [['GRAND TOTAL', formatCurrency(calculationSnapshot.totalPrice)]],
    theme: 'plain',
    styles: { fontSize: 13, fontStyle: 'bold', textColor: [41, 128, 185] },
    columnStyles: {
      0: { halign: 'right' },
      1: { halign: 'right', cellWidth: 50 }
    },
    margin: { left: pageWidth / 2, right: 14 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // ====================================================
  // 6. TERMS AND CONDITIONS
  // ====================================================
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }
  
  addSectionTitle('6. TERMS AND CONDITIONS');
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  const tnc = [
    '1. Validity: This quotation is valid for 14 days from the date of issuance.',
    '2. Payment Terms: A 50% down payment is required to commence production. The remaining balance must be cleared prior to delivery.',
    '3. Artwork & Proofing: Production lead time begins only after the final artwork proof is approved by the client in writing.',
    '4. Tolerances: Color variations up to 5% and quantity variations up to 3% are standard in offset printing and shall be considered acceptable.',
    '5. Cancellation: Orders cancelled after proof approval will be billed for all materials and labor incurred up to the point of cancellation.'
  ];
  
  tnc.forEach(line => {
    // Split text to fit width
    const splitText = doc.splitTextToSize(line, pageWidth - 28);
    doc.text(splitText, 14, currentY);
    currentY += splitText.length * 4.5;
  });

  currentY += 15;

  // ====================================================
  // FOOTER (SIGNATURES)
  // ====================================================
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Client Signature (Left)
  doc.text('Accepted By (Client)', 30, currentY, { align: 'center' });
  doc.setDrawColor(0,0,0);
  doc.line(14, currentY + 25, 60, currentY + 25);
  doc.text('Sign & Date', 35, currentY + 30, { align: 'center' });

  // Vendor Signature (Right)
  doc.text('Authorized Signature', pageWidth - 40, currentY, { align: 'center' });
  doc.line(pageWidth - 70, currentY + 25, pageWidth - 14, currentY + 25);
  doc.text('Smart Printing Rep.', pageWidth - 40, currentY + 30, { align: 'center' });


  // ====================================================
  // SAVE FILE
  // ====================================================
  const fileName = type === 'ops' ? `Quotation_OPS_${customerData.firstName || 'Client'}.pdf` : `Quotation_${customerData.firstName || 'Client'}.pdf`;
  doc.save(fileName);
};
