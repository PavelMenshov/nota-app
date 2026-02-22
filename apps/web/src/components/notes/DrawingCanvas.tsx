'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Pencil, Eraser, Undo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

interface DrawingCanvasProps {
  isActive: boolean;
  onToggle?: () => void;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
}

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6'];
const WIDTHS = [2, 4, 6];

export default function DrawingCanvas({ isActive, strokes, onStrokesChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(WIDTHS[0]);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  // Redraw all strokes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;
    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Set canvas to match parent dimensions
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    redraw();
  }, [isActive, redraw]);

  useEffect(() => {
    redraw();
  }, [strokes, currentStroke, redraw]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    const pos = getPos(e);

    if (tool === 'eraser') {
      // Remove strokes near click point
      const threshold = 10;
      const filtered = strokes.filter((stroke) =>
        !stroke.points.some((p) => Math.abs(p.x - pos.x) < threshold && Math.abs(p.y - pos.y) < threshold),
      );
      if (filtered.length !== strokes.length) {
        onStrokesChange(filtered);
      }
      return;
    }

    setIsDrawing(true);
    setCurrentStroke({ points: [pos], color, width });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    const pos = getPos(e);
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, pos],
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    if (currentStroke.points.length > 1) {
      onStrokesChange([...strokes, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    if (strokes.length > 0) {
      onStrokesChange(strokes.slice(0, -1));
    }
  };

  const handleClear = () => {
    onStrokesChange([]);
  };

  if (!isActive && strokes.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: isActive ? 20 : 10 }}>
      {/* Toolbar */}
      {isActive && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background border rounded-lg shadow-lg p-1 pointer-events-auto z-30">
          <Button
            variant={tool === 'pen' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setTool('pen')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setTool('eraser')}
          >
            <Eraser className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-5 bg-border mx-0.5" />
          {COLORS.map((c) => (
            <button
              key={c}
              className={`h-5 w-5 rounded-full border-2 ${color === c ? 'border-primary' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <div className="w-px h-5 bg-border mx-0.5" />
          {WIDTHS.map((w) => (
            <button
              key={w}
              className={`h-5 w-5 rounded-full flex items-center justify-center ${width === w ? 'bg-muted' : ''}`}
              onClick={() => setWidth(w)}
            >
              <span className="rounded-full bg-foreground" style={{ width: w + 2, height: w + 2 }} />
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-0.5" />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleUndo} disabled={strokes.length === 0}>
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear} disabled={strokes.length === 0}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${isActive ? 'pointer-events-auto cursor-crosshair' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
}
