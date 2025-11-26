"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  IconArrowUpRight,
  IconCircle,
  IconEraser,
  IconCheck,
  IconX,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type AnnotationTool = "arrow" | "circle" | "eraser";

export interface ArrowAnnotation {
  type: "arrow";
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

export interface CircleAnnotation {
  type: "circle";
  id: string;
  centerX: number;
  centerY: number;
  radius: number;
  color: string;
}

export type Annotation = ArrowAnnotation | CircleAnnotation;

interface ImageAnnotatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  initialAnnotations?: Annotation[];
  onSave: (annotations: Annotation[], annotatedImageUrl: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = [
  { name: "Röd", value: "#ef4444" },
  { name: "Gul", value: "#eab308" },
  { name: "Grön", value: "#22c55e" },
  { name: "Blå", value: "#3b82f6" },
];

const TOOLS: { key: AnnotationTool; icon: React.ReactNode; label: string }[] = [
  { key: "arrow", icon: <IconArrowUpRight className="size-4" />, label: "Pil" },
  { key: "circle", icon: <IconCircle className="size-4" />, label: "Cirkel" },
  { key: "eraser", icon: <IconEraser className="size-4" />, label: "Radera" },
];

// ============================================================================
// Component
// ============================================================================

export function ImageAnnotator({
  open,
  onOpenChange,
  imageUrl,
  initialAnnotations = [],
  onSave,
}: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("arrow");
  const [activeColor, setActiveColor] = useState(COLORS[0]?.value ?? "#ef4444");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load image
  useEffect(() => {
    if (!open) return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageUrl;
    
    return () => {
      setImageLoaded(false);
    };
  }, [imageUrl, open]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imageRef.current;
    
    if (!canvas || !ctx || !img) return;

    // Set canvas size to match image
    const maxWidth = 800;
    const maxHeight = 600;
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    annotations.forEach((annotation) => {
      drawAnnotation(ctx, annotation, scale);
    });

    // Draw current annotation being created
    if (isDrawing && startPoint && currentPoint) {
      if (activeTool === "arrow") {
        drawArrow(ctx, startPoint.x, startPoint.y, currentPoint.x, currentPoint.y, activeColor);
      } else if (activeTool === "circle") {
        const radius = Math.sqrt(
          Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2)
        );
        drawCircle(ctx, startPoint.x, startPoint.y, radius, activeColor);
      }
    }
  }, [annotations, isDrawing, startPoint, currentPoint, activeTool, activeColor]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, drawCanvas]);

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    
    if (activeTool === "eraser") {
      // Find and remove annotation at this position
      const annotationToRemove = findAnnotationAtPoint(pos.x, pos.y);
      if (annotationToRemove) {
        setAnnotations((prev) => prev.filter((a) => a.id !== annotationToRemove.id));
      }
      return;
    }
    
    setIsDrawing(true);
    setStartPoint(pos);
    setCurrentPoint(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setCurrentPoint(getMousePos(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false);
      return;
    }

    const id = `annotation-${Date.now()}`;

    if (activeTool === "arrow") {
      const newAnnotation: ArrowAnnotation = {
        type: "arrow",
        id,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: currentPoint.x,
        endY: currentPoint.y,
        color: activeColor,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
    } else if (activeTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(currentPoint.x - startPoint.x, 2) + Math.pow(currentPoint.y - startPoint.y, 2)
      );
      if (radius > 5) {
        const newAnnotation: CircleAnnotation = {
          type: "circle",
          id,
          centerX: startPoint.x,
          centerY: startPoint.y,
          radius,
          color: activeColor,
        };
        setAnnotations((prev) => [...prev, newAnnotation]);
      }
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  // Find annotation at point (for eraser)
  const findAnnotationAtPoint = (x: number, y: number): Annotation | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      if (!annotation) continue;
      
      if (annotation.type === "circle") {
        const circleAnnotation = annotation as CircleAnnotation;
        const dist = Math.sqrt(
          Math.pow(x - circleAnnotation.centerX, 2) + Math.pow(y - circleAnnotation.centerY, 2)
        );
        if (Math.abs(dist - circleAnnotation.radius) < 10) {
          return annotation;
        }
      } else if (annotation.type === "arrow") {
        const arrowAnnotation = annotation as ArrowAnnotation;
        // Check if point is near the arrow line
        const dist = distanceToLine(
          x, y,
          arrowAnnotation.startX, arrowAnnotation.startY,
          arrowAnnotation.endX, arrowAnnotation.endY
        );
        if (dist < 10) {
          return annotation;
        }
      }
    }
    return null;
  };

  // Handle save
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Generate data URL of annotated image
    const annotatedImageUrl = canvas.toDataURL("image/png");
    onSave(annotations, annotatedImageUrl);
    onOpenChange(false);
  };

  // Clear all annotations
  const handleClearAll = () => {
    setAnnotations([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Annotera bild</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b bg-muted/30 flex items-center gap-4">
          {/* Tools */}
          <div className="flex items-center gap-1">
            {TOOLS.map((tool) => (
              <Button
                key={tool.key}
                variant={activeTool === tool.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTool(tool.key)}
                className="gap-2"
              >
                {tool.icon}
                {tool.label}
              </Button>
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setActiveColor(color.value)}
                className={cn(
                  "size-6 rounded-full border-2 transition-transform",
                  activeColor === color.value ? "scale-110 border-foreground" : "border-transparent"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Clear */}
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-destructive">
            <IconTrash className="size-4 mr-2" />
            Rensa alla
          </Button>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="p-6 flex items-center justify-center bg-muted/50 overflow-auto">
          {imageLoaded ? (
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border rounded-lg shadow-lg cursor-crosshair"
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <span className="text-muted-foreground">Laddar bild...</span>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <IconX className="size-4 mr-2" />
            Avbryt
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <IconCheck className="size-4 mr-2" />
            Spara annoteringar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Drawing Helpers
// ============================================================================

function drawAnnotation(ctx: CanvasRenderingContext2D, annotation: Annotation, scale: number) {
  if (annotation.type === "arrow") {
    drawArrow(
      ctx,
      annotation.startX,
      annotation.startY,
      annotation.endX,
      annotation.endY,
      annotation.color
    );
  } else if (annotation.type === "circle") {
    drawCircle(ctx, annotation.centerX, annotation.centerY, annotation.radius, annotation.color);
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string
) {
  const headLength = 15;
  const angle = Math.atan2(endY - startY, endX - startX);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Draw line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();
}

function distanceToLine(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export default ImageAnnotator;
