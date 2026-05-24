"use client";

import { useEffect, useRef, useState } from "react";
import { useQuoteStore } from "@/store/useQuoteStore";
import { runBinPackingAction } from "@/actions/binPackingAction";
import { PackingResult } from "@/utils/guillotineAlgorithm";

export default function CanvasVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const productName =
    useQuoteStore((state) => state.productDetails.basicInfo.productName) ||
    "Product";
  const opDetails = useQuoteStore(
    (state) => state.operationalDetails.paperDetails,
  );
  const sizeDetails = useQuoteStore(
    (state) => state.productDetails.sizeDetails,
  );
  const setOpDetails = useQuoteStore((state) => state.setOperationalDetails);

  const containerW = Number(opDetails.inputSheetWidth) || 100;
  const containerH = Number(opDetails.inputSheetHeight) || 70;

  const itemW = sizeDetails.isSameAsFlat
    ? Number(sizeDetails.flat.width) || 9
    : Number(sizeDetails.close.width) || 9;
  const itemH = sizeDetails.isSameAsFlat
    ? Number(sizeDetails.flat.height) || 5.5
    : Number(sizeDetails.close.height) || 5.5;

  const gripperMargin = 1.5;
  const printableW = containerW;
  const printableH = Math.max(0, containerH - gripperMargin);

  const maxItemsEstimate = Math.floor(
    (printableW * printableH) / (itemW * itemH),
  );
  const safeQuantity = Math.max(1, Math.min(maxItemsEstimate * 2, 500));

  const [packResult, setPackResult] = useState<PackingResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeMode, setActiveMode] = useState<"print" | "cutting" | "gripper">(
    "print",
  );

  useEffect(() => {
    let active = true;
    const fetchPack = async () => {
      if (printableW > 0 && printableH > 0 && itemW > 0 && itemH > 0) {
        setIsCalculating(true);
        try {
          const result = await runBinPackingAction(printableW, printableH, [
            { width: itemW, height: itemH, quantity: safeQuantity },
          ]);
          if (active) setPackResult(result);
        } catch (error) {
          console.error("Failed to calculate bin packing:", error);
        } finally {
          if (active) setIsCalculating(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchPack();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [printableW, printableH, itemW, itemH, safeQuantity]);

  useEffect(() => {
    if (packResult) {
      const itemsPerSheet = packResult.totalItemsPlaced;
      const totalRequestedQty =
        Number(useQuoteStore.getState().productDetails.basicInfo.quantity) ||
        1000;
      const rec =
        itemsPerSheet > 0 ? Math.ceil(totalRequestedQty / itemsPerSheet) : 0;

      if (
        useQuoteStore.getState().operationalDetails.paperDetails
          .recommendedSheets !== rec
      ) {
        setOpDetails({
          paperDetails: {
            ...useQuoteStore.getState().operationalDetails.paperDetails,
            recommendedSheets: rec,
          },
        });
      }
    }
  }, [packResult, setOpDetails]);

  // Canvas Drawing with Strict Global CSS Colors & globalAlpha
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !packResult || isCalculating) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Read colors from global CSS
    const style = getComputedStyle(document.body);
    const cBg = style.getPropertyValue("--background").trim() || "#000000";
    const cFg = style.getPropertyValue("--foreground").trim() || "#ffffff";
    const cPrimary = style.getPropertyValue("--primary").trim() || "#f97316";
    const cDestructive =
      style.getPropertyValue("--destructive").trim() || "#ef4444";
    const cBorder = style.getPropertyValue("--border").trim() || "#334155";

    // Use globalAlpha to avoid browser issues with oklch slash syntax
    const setAlpha = (alpha: number) => {
      ctx.globalAlpha = alpha;
    };
    const resetAlpha = () => {
      ctx.globalAlpha = 1.0;
    };

    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cw = rect.width;
    const ch = rect.height;

    ctx.clearRect(0, 0, cw, ch);

    const padding = 20;
    const scale = Math.min(
      (cw - padding * 2) / containerW,
      (ch - padding * 2) / containerH,
    );

    const startX = (cw - containerW * scale) / 2;
    const startY = (ch - containerH * scale) / 2;

    // Sheet Background
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 15;
    ctx.fillStyle = cBg;
    ctx.fillRect(startX, startY, containerW * scale, containerH * scale);
    ctx.shadowColor = "transparent";

    // Sheet Border
    ctx.strokeStyle = cBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, containerW * scale, containerH * scale);

    // Gripper Margin (Top)
    if (activeMode === "print" || activeMode === "gripper") {
      setAlpha(0.05);
      ctx.fillStyle = cDestructive;
      ctx.fillRect(startX, startY, containerW * scale, gripperMargin * scale);
      resetAlpha();

      setAlpha(0.5);
      ctx.strokeStyle = cDestructive;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(startX, startY, containerW * scale, gripperMargin * scale);
      ctx.setLineDash([]);
      resetAlpha();

      if (activeMode === "gripper") {
        setAlpha(0.1);
        ctx.fillStyle = cDestructive;
        ctx.fillRect(startX, startY, containerW * scale, gripperMargin * scale);
        resetAlpha();

        ctx.fillStyle = cDestructive;
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `Gripper Edge (${gripperMargin}cm)`,
          startX + (containerW * scale) / 2,
          startY + (gripperMargin * scale) / 2,
        );
      }
    }

    const printableStartY = startY + gripperMargin * scale;
    const printableAreaHeight = containerH * scale - gripperMargin * scale;

    if (activeMode === "print") {
      setAlpha(0.03);
      ctx.fillStyle = cPrimary;
      ctx.fillRect(
        startX,
        printableStartY,
        containerW * scale,
        printableAreaHeight,
      );
      resetAlpha();

      setAlpha(0.5);
      ctx.strokeStyle = cPrimary;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      const safeMargin = 4;
      ctx.strokeRect(
        startX + safeMargin,
        printableStartY + safeMargin,
        containerW * scale - safeMargin * 2,
        printableAreaHeight - safeMargin * 2,
      );
      ctx.setLineDash([]);
      resetAlpha();
    }

    packResult.placements.forEach((item) => {
      const x = startX + item.x * scale;
      const y = printableStartY + item.y * scale;
      const w = item.width * scale;
      const h = item.height * scale;

      if (activeMode === "print") {
        // Uniform color for all items based on primary brand color
        setAlpha(0.15);
        ctx.fillStyle = cPrimary;
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
        resetAlpha();

        setAlpha(0.8);
        ctx.strokeStyle = cPrimary;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
        resetAlpha();

        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        if (item.rotated) {
          ctx.rotate(-Math.PI / 2);
        }

        const visualW = item.rotated ? h : w;
        const visualH = item.rotated ? w : h;

        // Draw Pill and Text if enough space
        if (visualW > 35 && visualH > 20) {
          const text = `${item.rotated ? item.height : item.width}x${item.rotated ? item.width : item.height}`;

          ctx.fillStyle = cBg;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-16, -8, 32, 16, 4);
          } else {
            ctx.rect(-16, -8, 32, 16);
          }
          ctx.fill();

          ctx.fillStyle = cFg;
          ctx.font = "bold 8px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, 0, 0);
        }
        ctx.restore();
      } else if (activeMode === "cutting") {
        ctx.strokeStyle = cPrimary;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);

        const markLen = 4;
        ctx.strokeStyle = cDestructive;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - markLen, y);
        ctx.lineTo(x + markLen, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - markLen);
        ctx.lineTo(x, y + markLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w - markLen, y);
        ctx.lineTo(x + w + markLen, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w, y - markLen);
        ctx.lineTo(x + w, y + markLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - markLen, y + h);
        ctx.lineTo(x + markLen, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + h - markLen);
        ctx.lineTo(x, y + h + markLen);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w - markLen, y + h);
        ctx.lineTo(x + w + markLen, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w, y + h - markLen);
        ctx.lineTo(x + w, y + h + markLen);
        ctx.stroke();
      } else if (activeMode === "gripper") {
        setAlpha(0.15);
        ctx.strokeStyle = cFg;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        resetAlpha();
      }
    });
  }, [packResult, containerW, containerH, isCalculating, activeMode]);

  const itemsPerSheet = packResult?.totalItemsPlaced || 0;
  const totalContainerArea = containerW * containerH;
  const totalItemArea =
    packResult?.placements.reduce((sum, p) => sum + p.width * p.height, 0) || 0;
  const utilization =
    totalContainerArea > 0 ? (totalItemArea / totalContainerArea) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-primary mb-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <h3 className="text-xl font-bold text-foreground">
            Sheet Layout Visualization - {productName}
          </h3>
        </div>
        <p className="text-sm font-medium text-foreground/80">
          Product-Specific Sheet Layout Pattern
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setActiveMode("print")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border ${activeMode === "print" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Print Layout
        </button>
        <button
          onClick={() => setActiveMode("cutting")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border ${activeMode === "cutting" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
            <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
            <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
          </svg>
          Cutting Operations
        </button>
        <button
          onClick={() => setActiveMode("gripper")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors border ${activeMode === "gripper" ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-muted"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Gripper Handling
        </button>
      </div>

      <div className="bg-background border border-border rounded-xl p-6 flex flex-col items-center justify-start min-h-[600px] relative shadow-sm">
        <div className="text-center mb-6 w-full relative z-10 shrink-0">
          <h4 className="text-lg font-bold text-foreground mb-2 capitalize">
            {activeMode === "print"
              ? "Print Layout"
              : activeMode === "cutting"
                ? "Cutting Operations"
                : "Gripper Handling"}
          </h4>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium bg-muted border border-border px-3 py-1 rounded-md max-w-fit mx-auto">
            <span>
              {containerW} x {containerH} cm
            </span>
            <span>•</span>
            <span>Yield: {itemsPerSheet} pieces</span>
            <span>•</span>
            <span>normal</span>
          </div>
          <div className="mt-2 bg-foreground text-background text-xs font-bold px-3 py-1 rounded shadow-sm inline-block">
            {containerW} x {containerH} cm
          </div>
        </div>

        {isCalculating ? (
          <div className="w-full max-w-[700px] h-[400px] bg-muted rounded animate-pulse border-2 border-border border-dashed flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-primary mb-4"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-muted-foreground font-medium">
              Running 2D Guillotine Pack...
            </span>
          </div>
        ) : (
          <div className="w-full flex-1 relative flex items-center justify-center min-h-[450px]">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full drop-shadow-sm"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-wider flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            Advanced Analysis
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Items per Sheet</span>
              <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded">
                {itemsPerSheet} pcs
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Yield Quality</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${utilization > 85 ? "bg-primary/20 text-primary" : utilization > 60 ? "bg-accent text-accent-foreground" : "bg-destructive/20 text-destructive"}`}
              >
                {utilization.toFixed(1)}%{" "}
                {utilization > 85
                  ? "Excellent"
                  : utilization > 60
                    ? "Fair"
                    : "Poor"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 tracking-wider flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Server Intelligence
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Algorithm</span>
              <span className="font-medium text-foreground">Guillotine 2D</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Execution Env</span>
              <span className="text-primary font-bold text-xs bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                Node.js Server
              </span>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100"
              height="100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <h4 className="text-xs font-bold text-primary uppercase mb-4 tracking-wider">
            Operations Dashboard
          </h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end text-sm mb-1">
                <span className="text-muted-foreground font-medium">
                  Total Sheets Needed
                </span>
                <span className="font-black text-2xl text-primary leading-none">
                  {opDetails.recommendedSheets}
                </span>
              </div>
            </div>
            <div>
              <div className="w-full bg-border/50 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${utilization}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
