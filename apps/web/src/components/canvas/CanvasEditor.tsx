'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StickyNote,
  Type,
  Square,
  ArrowRight,
  Image as ImageIcon,
  MessageCircle,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Frame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ---------- Types ----------

export type CanvasElementType =
  | 'sticky-note'
  | 'text-block'
  | 'shape'
  | 'connector'
  | 'image-card'
  | 'comment'
  | 'frame';

export type ShapeKind = 'rectangle' | 'ellipse' | 'diamond' | 'triangle' | 'star';

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  color?: string;
  tag?: string;
  shapeKind?: ShapeKind;
  fromId?: string;
  toId?: string;
  imageUrl?: string;
  fileName?: string;
}

export interface CanvasState {
  elements: CanvasElement[];
  viewport: { x: number; y: number; zoom: number };
}

interface CanvasEditorProps {
  initialContent: CanvasState | null;
  onSave: (content: CanvasState) => void;
}

const STICKY_COLORS = ['#FEF08A', '#BBF7D0', '#BFDBFE', '#FED7AA', '#E9D5FF', '#FECDD3'];

let idCounter = 0;
function genId(): string {
  return `el-${Date.now()}-${++idCounter}`;
}

// ---------- Component ----------

export default function CanvasEditor({ initialContent, onSave }: CanvasEditorProps) {
  const [elements, setElements] = useState<CanvasElement[]>(
    initialContent?.elements ?? [],
  );
  const [viewport, setViewport] = useState(
    initialContent?.viewport ?? { x: 0, y: 0, zoom: 1 },
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | CanvasElementType>('select');
  const [dragging, setDragging] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; origVX: number; origVY: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Auto-save debounce
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSave = useCallback(
    (els: CanvasElement[], vp: typeof viewport) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSave({ elements: els, viewport: vp });
      }, 1000);
    },
    [onSave],
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !editingId) {
        const target = e.target as HTMLElement;
        if (target.closest('textarea') || target.closest('input') || target.closest('[contenteditable="true"]')) return;
        e.preventDefault();
        deleteElement(selectedId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, editingId, deleteElement]);

  const updateElement = useCallback(
    (id: string, patch: Partial<CanvasElement>) => {
      setElements((prev) => {
        const next = prev.map((el) => (el.id === id ? { ...el, ...patch } : el));
        triggerSave(next, viewport);
        return next;
      });
    },
    [viewport, triggerSave],
  );

  const deleteElement = useCallback(
    (id: string) => {
      setElements((prev) => {
        const next = prev.filter((el) => el.id !== id && el.fromId !== id && el.toId !== id);
        triggerSave(next, viewport);
        return next;
      });
      if (selectedId === id) setSelectedId(null);
      if (editingId === id) setEditingId(null);
    },
    [selectedId, editingId, viewport, triggerSave],
  );

  const addElement = useCallback(
    (type: CanvasElementType, cx: number, cy: number) => {
      const id = genId();
      const base: CanvasElement = { id, type, x: cx - 75, y: cy - 40, width: 150, height: 80 };
      switch (type) {
        case 'sticky-note':
          Object.assign(base, { text: 'New note', color: STICKY_COLORS[0], width: 160, height: 120 });
          break;
        case 'text-block':
          Object.assign(base, { text: 'Text block', width: 200, height: 100 });
          break;
        case 'shape':
          Object.assign(base, { shapeKind: 'rectangle' as ShapeKind, color: '#93C5FD', width: 140, height: 100 });
          break;
        case 'image-card':
          Object.assign(base, { text: 'Image', width: 160, height: 120, color: '#F3F4F6' });
          break;
        case 'comment':
          Object.assign(base, { text: 'Comment', color: '#FEF9C3', width: 180, height: 60 });
          break;
        case 'frame':
          Object.assign(base, { text: 'Section', color: '#E0E7FF', width: 320, height: 200 });
          break;
        default:
          break;
      }
      setElements((prev) => {
        const next = [...prev, base];
        triggerSave(next, viewport);
        return next;
      });
      setSelectedId(id);
      setTool('select');
    },
    [viewport, triggerSave],
  );

  const toCanvas = useCallback(
    (e: React.MouseEvent): { cx: number; cy: number } => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { cx: 0, cy: 0 };
      return {
        cx: (e.clientX - rect.left - viewport.x) / viewport.zoom,
        cy: (e.clientY - rect.top - viewport.y) / viewport.zoom,
      };
    },
    [viewport],
  );

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setPanning({ startX: e.clientX, startY: e.clientY, origVX: viewport.x, origVY: viewport.y });
      return;
    }
    if (tool !== 'select' && tool !== 'connector') {
      const { cx, cy } = toCanvas(e);
      addElement(tool, cx, cy);
      return;
    }
    if (tool === 'select') {
      setSelectedId(null);
      setEditingId(null);
      setPanning({ startX: e.clientX, startY: e.clientY, origVX: viewport.x, origVY: viewport.y });
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (panning) {
      const dx = e.clientX - panning.startX;
      const dy = e.clientY - panning.startY;
      setViewport((v) => ({ ...v, x: panning.origVX + dx, y: panning.origVY + dy }));
      return;
    }
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / viewport.zoom;
      const dy = (e.clientY - dragging.startY) / viewport.zoom;
      updateElement(dragging.id, { x: dragging.origX + dx, y: dragging.origY + dy });
    }
  };

  const handleSvgMouseUp = () => {
    if (panning) {
      triggerSave(elements, viewport);
    }
    setPanning(null);
    setDragging(null);
  };

  const handleElementMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (tool === 'connector') {
      if (!connectingFrom) {
        setConnectingFrom(el.id);
      } else if (connectingFrom !== el.id) {
        const id = genId();
        const conn: CanvasElement = {
          id,
          type: 'connector',
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          fromId: connectingFrom,
          toId: el.id,
          color: '#6B7280',
        };
        setElements((prev) => {
          const next = [...prev, conn];
          triggerSave(next, viewport);
          return next;
        });
        setConnectingFrom(null);
        setTool('select');
      }
      return;
    }
    setSelectedId(el.id);
    setDragging({ id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y });
  };

  const handleElementDoubleClick = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    if (el.type !== 'connector') {
      setEditingId(el.id);
    }
  };

  const handleZoom = (delta: number) => {
    setViewport((v) => {
      const newZoom = Math.min(3, Math.max(0.2, v.zoom + delta));
      return { ...v, zoom: newZoom };
    });
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    } else {
      setViewport((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
    }
  }, []);

  const elCenter = (el: CanvasElement) => ({ cx: el.x + el.width / 2, cy: el.y + el.height / 2 });

  const selectedEl = elements.find((el) => el.id === selectedId);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-background z-10 flex-wrap">
        <ToolBtn icon={<MousePointer className="h-4 w-4" />} label="Select" active={tool === 'select'} onClick={() => { setTool('select'); setConnectingFrom(null); }} />
        <div className="w-px h-6 bg-border mx-1" />
        <ToolBtn icon={<StickyNote className="h-4 w-4" />} label="Sticky Note" active={tool === 'sticky-note'} onClick={() => setTool('sticky-note')} />
        <ToolBtn icon={<Type className="h-4 w-4" />} label="Text Block" active={tool === 'text-block'} onClick={() => setTool('text-block')} />
        <ToolBtn icon={<Square className="h-4 w-4" />} label="Shape" active={tool === 'shape'} onClick={() => setTool('shape')} />
        <ToolBtn icon={<ArrowRight className="h-4 w-4" />} label="Connector" active={tool === 'connector'} onClick={() => { setTool('connector'); setConnectingFrom(null); }} />
        <ToolBtn icon={<ImageIcon className="h-4 w-4" />} label="Image Card" active={tool === 'image-card'} onClick={() => setTool('image-card')} />
        <ToolBtn icon={<MessageCircle className="h-4 w-4" />} label="Comment" active={tool === 'comment'} onClick={() => setTool('comment')} />
        <ToolBtn icon={<Frame className="h-4 w-4" />} label="Frame" active={tool === 'frame'} onClick={() => setTool('frame')} />
        <div className="w-px h-6 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom(0.1)} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(viewport.zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom(-0.1)} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        {selectedEl && (
          <>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteElement(selectedEl.id)} title="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
        {tool === 'connector' && (
          <span className="ml-2 text-xs text-muted-foreground">
            {connectingFrom ? 'Click target element' : 'Click source element'}
          </span>
        )}
      </div>

      {/* Properties bar */}
      {selectedEl && selectedEl.type !== 'connector' && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30 text-sm">
          {(selectedEl.type === 'sticky-note' || selectedEl.type === 'shape' || selectedEl.type === 'frame') && (
            <>
              <span className="text-muted-foreground text-xs">Color:</span>
              {STICKY_COLORS.map((c) => (
                <button
                  key={c}
                  className={`h-5 w-5 rounded-full border-2 ${selectedEl.color === c ? 'border-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => updateElement(selectedEl.id, { color: c })}
                />
              ))}
            </>
          )}
          {selectedEl.type === 'shape' && (
            <>
              <div className="w-px h-5 bg-border mx-1" />
              <span className="text-muted-foreground text-xs">Shape:</span>
              {(['rectangle', 'ellipse', 'diamond', 'triangle', 'star'] as ShapeKind[]).map((s) => (
                <button
                  key={s}
                  className={`px-2 py-0.5 rounded text-xs ${selectedEl.shapeKind === s ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}
                  onClick={() => updateElement(selectedEl.id, { shapeKind: s })}
                >
                  {s}
                </button>
              ))}
            </>
          )}
          {selectedEl.type === 'sticky-note' && (
            <>
              <div className="w-px h-5 bg-border mx-1" />
              <span className="text-muted-foreground text-xs">Tag:</span>
              <input
                className="bg-background border rounded px-2 py-0.5 text-xs w-24"
                placeholder="tag"
                value={selectedEl.tag ?? ''}
                onChange={(e) => updateElement(selectedEl.id, { tag: e.target.value })}
              />
            </>
          )}
        </div>
      )}

      {/* SVG Canvas — min height so workspace is usable on all screens */}
      <div className="flex-1 min-h-[680px] overflow-hidden bg-[#f8f9fa] relative">
        <svg
          ref={svgRef}
          className="w-full h-full select-none"
          onMouseDown={handleSvgMouseDown}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
          onMouseLeave={handleSvgMouseUp}
          onWheel={handleWheel}
          style={{ cursor: tool === 'select' ? (panning ? 'grabbing' : 'default') : 'crosshair' }}
        >
          <defs>
            <pattern id="grid" width={20 * viewport.zoom} height={20 * viewport.zoom} patternUnits="userSpaceOnUse" x={viewport.x % (20 * viewport.zoom)} y={viewport.y % (20 * viewport.zoom)}>
              <circle cx={1} cy={1} r={0.5} fill="#d1d5db" />
            </pattern>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
            {/* Connectors (below elements) */}
            {elements
              .filter((el) => el.type === 'connector')
              .map((conn) => {
                const from = elements.find((e) => e.id === conn.fromId);
                const to = elements.find((e) => e.id === conn.toId);
                if (!from || !to) return null;
                const fc = elCenter(from);
                const tc = elCenter(to);
                return (
                  <g key={conn.id} onClick={(e) => { e.stopPropagation(); setSelectedId(conn.id); }}>
                    <line x1={fc.cx} y1={fc.cy} x2={tc.cx} y2={tc.cy} stroke={conn.color || '#6B7280'} strokeWidth={selectedId === conn.id ? 3 : 2} markerEnd="url(#arrowhead)" />
                    <line x1={fc.cx} y1={fc.cy} x2={tc.cx} y2={tc.cy} stroke="transparent" strokeWidth={12} style={{ cursor: 'pointer' }} />
                  </g>
                );
              })}

            {/* Elements */}
            {elements
              .filter((el) => el.type !== 'connector')
              .map((el) => (
                <ElementView
                  key={el.id}
                  element={el}
                  selected={el.id === selectedId}
                  editing={el.id === editingId}
                  onMouseDown={(e) => handleElementMouseDown(e, el)}
                  onDoubleClick={(e) => handleElementDoubleClick(e, el)}
                  onTextChange={(text) => updateElement(el.id, { text })}
                  onBlur={() => setEditingId(null)}
                />
              ))}
          </g>
        </svg>

        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground">
              <Plus className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a tool and click on the canvas to add elements</p>
              <p className="text-xs mt-1 opacity-70">Alt+drag or scroll to pan · Ctrl+scroll to zoom</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

function ToolBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <Button variant={active ? 'default' : 'ghost'} size="sm" className="h-8 gap-1.5 text-xs" onClick={onClick} title={label}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

function ElementView({
  element: el,
  selected,
  editing,
  onMouseDown,
  onDoubleClick,
  onTextChange,
  onBlur,
}: {
  element: CanvasElement;
  selected: boolean;
  editing: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onTextChange: (t: string) => void;
  onBlur: () => void;
}) {
  const outlineColor = selected ? '#3B82F6' : 'transparent';
  const common = { onMouseDown, onDoubleClick, style: { cursor: 'move' } as React.CSSProperties };

  switch (el.type) {
    case 'sticky-note':
      return (
        <g {...common}>
          <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={6} fill={el.color || '#FEF08A'} stroke={outlineColor} strokeWidth={selected ? 2 : 0} filter="drop-shadow(0 1px 3px rgba(0,0,0,0.12))" />
          {el.tag && <text x={el.x + 8} y={el.y + 14} fontSize={9} fill="#6B7280" fontFamily="sans-serif">#{el.tag}</text>}
          {editing ? (
            <foreignObject x={el.x + 6} y={el.y + (el.tag ? 18 : 8)} width={el.width - 12} height={el.height - (el.tag ? 26 : 16)}>
              <textarea autoFocus className="w-full h-full bg-transparent resize-none outline-none text-sm p-0" defaultValue={el.text ?? ''} onBlur={(e) => { onTextChange(e.target.value); onBlur(); }} />
            </foreignObject>
          ) : (
            <text x={el.x + el.width / 2} y={el.y + el.height / 2 + (el.tag ? 4 : 0)} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#1F2937" fontFamily="sans-serif">{trunc(el.text ?? '', 60)}</text>
          )}
        </g>
      );

    case 'text-block':
      return (
        <g {...common}>
          <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={4} fill="#FFFFFF" stroke={selected ? '#3B82F6' : '#E5E7EB'} strokeWidth={selected ? 2 : 1} />
          {editing ? (
            <foreignObject x={el.x + 8} y={el.y + 8} width={el.width - 16} height={el.height - 16}>
              <textarea autoFocus className="w-full h-full bg-transparent resize-none outline-none text-sm p-0" defaultValue={el.text ?? ''} onBlur={(e) => { onTextChange(e.target.value); onBlur(); }} />
            </foreignObject>
          ) : (
            <foreignObject x={el.x + 8} y={el.y + 8} width={el.width - 16} height={el.height - 16}>
              <div style={{ fontSize: 13, color: '#374151', fontFamily: 'sans-serif', overflow: 'hidden', height: '100%' }}>{el.text}</div>
            </foreignObject>
          )}
        </g>
      );

    case 'shape': {
      const { shapeKind = 'rectangle' } = el;
      const border = selected ? '#3B82F6' : '#9CA3AF';
      const bw = selected ? 2 : 1;
      const fill = el.color || '#93C5FD';
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const r = Math.min(el.width, el.height) / 2;
      const starPoints = (n: number, outer: number, inner: number) => {
        const pts: string[] = [];
        for (let i = 0; i < n * 2; i++) {
          const rad = (Math.PI / n) * i - Math.PI / 2;
          const rr = i % 2 === 0 ? outer : inner;
          pts.push(`${cx + rr * Math.cos(rad)},${cy + rr * Math.sin(rad)}`);
        }
        return pts.join(' ');
      };
      return (
        <g {...common}>
          {shapeKind === 'rectangle' && <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={4} fill={fill} stroke={border} strokeWidth={bw} />}
          {shapeKind === 'ellipse' && <ellipse cx={cx} cy={cy} rx={el.width / 2} ry={el.height / 2} fill={fill} stroke={border} strokeWidth={bw} />}
          {shapeKind === 'diamond' && <polygon points={`${cx},${el.y} ${el.x + el.width},${cy} ${cx},${el.y + el.height} ${el.x},${cy}`} fill={fill} stroke={border} strokeWidth={bw} />}
          {shapeKind === 'triangle' && <polygon points={`${cx},${el.y} ${el.x + el.width},${el.y + el.height} ${el.x},${el.y + el.height}`} fill={fill} stroke={border} strokeWidth={bw} />}
          {shapeKind === 'star' && <polygon points={starPoints(5, r, r * 0.4)} fill={fill} stroke={border} strokeWidth={bw} />}
          {editing ? (
            <foreignObject x={el.x + 8} y={el.y + 8} width={el.width - 16} height={el.height - 16}>
              <textarea autoFocus className="w-full h-full bg-transparent resize-none outline-none text-sm text-center p-0" defaultValue={el.text ?? ''} onBlur={(e) => { onTextChange(e.target.value); onBlur(); }} />
            </foreignObject>
          ) : (
            <text x={el.x + el.width / 2} y={el.y + el.height / 2} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#1F2937" fontFamily="sans-serif">{trunc(el.text ?? '', 40)}</text>
          )}
        </g>
      );
    }

    case 'image-card':
      return (
        <g {...common}>
          <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={6} fill={el.color || '#F3F4F6'} stroke={selected ? '#3B82F6' : '#D1D5DB'} strokeWidth={selected ? 2 : 1} />
          {el.imageUrl ? (
            <image href={el.imageUrl} x={el.x + 4} y={el.y + 4} width={el.width - 8} height={el.height - 24} preserveAspectRatio="xMidYMid meet" />
          ) : (
            <text x={el.x + el.width / 2} y={el.y + el.height / 2 - 4} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#9CA3AF" fontFamily="sans-serif">📎 Image / File</text>
          )}
          {editing ? (
            <foreignObject x={el.x + 4} y={el.y + el.height - 22} width={el.width - 8} height={18}>
              <input autoFocus className="w-full bg-transparent outline-none text-xs text-center" defaultValue={el.text ?? ''} onBlur={(e) => { onTextChange(e.target.value); onBlur(); }} />
            </foreignObject>
          ) : (
            <text x={el.x + el.width / 2} y={el.y + el.height - 8} textAnchor="middle" fontSize={10} fill="#6B7280" fontFamily="sans-serif">{trunc(el.text ?? '', 25)}</text>
          )}
        </g>
      );

    case 'frame':
      return (
        <g {...common}>
          <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={12} fill={el.color || '#E0E7FF'} stroke={selected ? '#3B82F6' : '#A5B4FC'} strokeWidth={selected ? 2 : 1} strokeDasharray={selected ? undefined : '8 4'} />
          <rect x={el.x} y={el.y} width={el.width} height={28} rx={12} fill={el.color || '#C7D2FE'} />
          <rect x={el.x} y={el.y + 20} width={el.width} height={8} fill={el.color || '#E0E7FF'} />
          {editing ? (
            <foreignObject x={el.x + 12} y={el.y + 6} width={el.width - 24} height={20}>
              <input autoFocus className="w-full h-full bg-transparent outline-none text-sm font-medium" defaultValue={el.text ?? ''} onBlur={(e) => { onTextChange(e.target.value); onBlur(); }} />
            </foreignObject>
          ) : (
            <text x={el.x + 14} y={el.y + 20} fontSize={12} fontWeight="600" fill="#3730A3" fontFamily="sans-serif">{trunc(el.text ?? 'Section', 35)}</text>
          )}
        </g>
      );

    case 'comment':
      return (
        <g {...common}>
          <rect x={el.x} y={el.y} width={el.width} height={el.height} rx={8} fill={el.color || '#FEF9C3'} stroke={selected ? '#3B82F6' : '#E5E7EB'} strokeWidth={selected ? 2 : 1} />
          <polygon points={`${el.x + 12},${el.y + el.height} ${el.x + 24},${el.y + el.height} ${el.x + 8},${el.y + el.height + 10}`} fill={el.color || '#FEF9C3'} stroke={selected ? '#3B82F6' : '#E5E7EB'} strokeWidth={1} />
          <line x1={el.x + 10} y1={el.y + el.height} x2={el.x + 25} y2={el.y + el.height} stroke={el.color || '#FEF9C3'} strokeWidth={2} />
          <text x={el.x + 8} y={el.y + 14} fontSize={10} fill="#92400E" fontFamily="sans-serif">💬</text>
          {editing ? (
            <foreignObject x={el.x + 22} y={el.y + 4} width={el.width - 28} height={el.height - 8}>
              <textarea autoFocus className="w-full h-full bg-transparent resize-none outline-none text-xs p-0" defaultValue={el.text ?? ''} onBlur={(e) => { onTextChange(e.target.value); onBlur(); }} />
            </foreignObject>
          ) : (
            <foreignObject x={el.x + 22} y={el.y + 4} width={el.width - 28} height={el.height - 8}>
              <div style={{ fontSize: 11, color: '#92400E', fontFamily: 'sans-serif', overflow: 'hidden', height: '100%' }}>{el.text}</div>
            </foreignObject>
          )}
        </g>
      );

    default:
      return null;
  }
}

function trunc(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}
