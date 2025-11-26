"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Arrow, Circle, Transformer } from "react-konva";
import { Button } from "@/components/ui/button";
import { IconCircle, IconArrowRight, IconTrash, IconDownload, IconArrowBackUp } from "@tabler/icons-react";
import type { AnnotationShape, AnnotationShapeType } from "@/lib/types/rapport";
import { cn } from "@/lib/utils";

interface ImageAnnotationCanvasProps {
  imageUrl: string;
  shapes: AnnotationShape[];
  onChange: (shapes: AnnotationShape[]) => void;
  onSaveAnnotatedImage?: (dataUrl: string) => void;
  readOnly?: boolean;
}

export function ImageAnnotationCanvas({
  imageUrl,
  shapes,
  onChange,
  onSaveAnnotatedImage,
  readOnly = false,
}: ImageAnnotationCanvasProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<AnnotationShapeType | null>("arrow");
  const [selectedColor, setSelectedColor] = useState("#ef4444"); // red-500
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [draftShape, setDraftShape] = useState<AnnotationShape | null>(null);
  const stageRef = useRef<any>(null);

  // Ladda bilden
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [imageUrl]);

  const handleMouseDown = (e: any) => {
    if (readOnly || !selectedTool) return;
    
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    setIsDrawing(true);
    setStartPos(pos);
    setSelectedShapeId(null); // Avmarkera när man börjar rita
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || readOnly || !selectedTool || !startPos) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    const draft: AnnotationShape = {
      id: 'draft',
      type: selectedTool,
      x: startPos.x,
      y: startPos.y,
      color: selectedColor,
      strokeWidth: 3,
    };

    if (selectedTool === "arrow") {
      draft.width = pos.x - startPos.x;
      draft.height = pos.y - startPos.y;
    } else if (selectedTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
      );
      draft.radius = radius;
    }

    setDraftShape(draft);
  };

  const handleMouseUp = (e: any) => {
    if (readOnly || !selectedTool || !isDrawing || !startPos) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    const newShape: AnnotationShape = {
      id: `shape-${Date.now()}`,
      type: selectedTool,
      x: startPos.x,
      y: startPos.y,
      color: selectedColor,
      strokeWidth: 3,
    };

    if (selectedTool === "arrow") {
      newShape.width = pos.x - startPos.x;
      newShape.height = pos.y - startPos.y;
    } else if (selectedTool === "circle") {
      const radius = Math.sqrt(
        Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)
      );
      newShape.radius = radius;
    }

    onChange([...shapes, newShape]);
    setIsDrawing(false);
    setStartPos(null);
    setDraftShape(null);
  };

  const handleShapeClick = (shapeId: string) => {
    if (readOnly) return;
    setSelectedShapeId(shapeId);
  };

  const handleDeleteSelected = () => {
    if (!selectedShapeId) return;
    onChange(shapes.filter((s) => s.id !== selectedShapeId));
    setSelectedShapeId(null);
  };

  const handleUndo = () => {
    if (shapes.length === 0) return;
    onChange(shapes.slice(0, -1));
    setSelectedShapeId(null);
  };

  const handleExportImage = () => {
    if (!stageRef.current) return;
    const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
    onSaveAnnotatedImage?.(dataUrl);
  };

  const colors = [
    { value: "#ef4444", label: "Röd" },
    { value: "#f59e0b", label: "Orange" },
    { value: "#10b981", label: "Grön" },
    { value: "#3b82f6", label: "Blå" },
  ];

  if (!image) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Laddar bild...</p>
      </div>
    );
  }

  const canvasWidth = Math.min(image.width, 800);
  const canvasHeight = (image.height / image.width) * canvasWidth;

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Verktyg:</span>
            <Button
              variant={selectedTool === "arrow" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("arrow")}
              className="gap-2"
            >
              <IconArrowRight className="size-4" />
              Pil
            </Button>
            <Button
              variant={selectedTool === "circle" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("circle")}
              className="gap-2"
            >
              <IconCircle className="size-4" />
              Cirkel
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Färg:</span>
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setSelectedColor(color.value)}
                className={cn(
                  "size-8 rounded-full border-2 transition-all",
                  selectedColor === color.value
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border hover:border-primary"
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={shapes.length === 0}
              className="gap-2"
            >
              <IconArrowBackUp className="size-4" />
              Ångra
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={!selectedShapeId}
              className="gap-2"
            >
              <IconTrash className="size-4" />
              Ta bort markerad
            </Button>
            {onSaveAnnotatedImage && (
              <Button
                variant="default"
                size="sm"
                onClick={handleExportImage}
                className="gap-2"
              >
                <IconDownload className="size-4" />
                Spara annoterad bild
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-auto rounded-lg border bg-muted/10">
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer>
            <KonvaImage
              image={image}
              width={canvasWidth}
              height={canvasHeight}
            />
            {/* Permanenta shapes */}
            {shapes.map((shape) => {
              const isSelected = shape.id === selectedShapeId;
              if (shape.type === "arrow") {
                return (
                  <Arrow
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    points={[0, 0, shape.width || 0, shape.height || 0]}
                    stroke={shape.color}
                    strokeWidth={isSelected ? (shape.strokeWidth || 3) + 2 : (shape.strokeWidth || 3)}
                    fill={shape.color}
                    pointerLength={10}
                    pointerWidth={10}
                    onClick={() => handleShapeClick(shape.id)}
                    draggable={!readOnly}
                  />
                );
              } else if (shape.type === "circle") {
                return (
                  <Circle
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    radius={shape.radius || 50}
                    stroke={shape.color}
                    strokeWidth={isSelected ? (shape.strokeWidth || 3) + 2 : (shape.strokeWidth || 3)}
                    onClick={() => handleShapeClick(shape.id)}
                    draggable={!readOnly}
                  />
                );
              }
              return null;
            })}
            {/* Draft shape (live preview) */}
            {draftShape && (
              <>
                {draftShape.type === "arrow" && (
                  <Arrow
                    x={draftShape.x}
                    y={draftShape.y}
                    points={[0, 0, draftShape.width || 0, draftShape.height || 0]}
                    stroke={draftShape.color}
                    strokeWidth={draftShape.strokeWidth || 3}
                    fill={draftShape.color}
                    pointerLength={10}
                    pointerWidth={10}
                    opacity={0.7}
                  />
                )}
                {draftShape.type === "circle" && (
                  <Circle
                    x={draftShape.x}
                    y={draftShape.y}
                    radius={draftShape.radius || 50}
                    stroke={draftShape.color}
                    strokeWidth={draftShape.strokeWidth || 3}
                    opacity={0.7}
                  />
                )}
              </>
            )}
          </Layer>
        </Stage>
      </div>

      {!readOnly && (
        <p className="text-xs text-muted-foreground">
          Välj ett verktyg och klicka-och-dra på bilden för att markera läckage eller andra områden.
        </p>
      )}
    </div>
  );
}
