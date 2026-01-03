import { useRef, useEffect, useState } from 'react';
import { Stop, Route } from '@/types/transport';

interface SchemeCanvasProps {
  stops: Stop[];
  routes: Route[];
  selectedStops: string[];
  editingSegment: { routeId: string; from: string; to: string } | null;
  mode: 'select' | 'add-stop';
  onStopSelect: (stopId: string | null, ctrlKey: boolean) => void;
  onStopMove: (stopIds: string[], x: number, y: number) => void;
  onSegmentPointMove: (routeId: string, from: string, to: string, pointIndex: number, x: number, y: number) => void;
  onCanvasClick: (x: number, y: number) => void;
}

const SchemeCanvas = ({
  stops,
  routes,
  selectedStops,
  editingSegment,
  mode,
  onStopSelect,
  onStopMove,
  onSegmentPointMove,
  onCanvasClick,
}: SchemeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{
    type: 'stop' | 'point';
    stopIds?: string[];
    routeId?: string;
    from?: string;
    to?: string;
    pointIndex?: number;
  } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialPositions, setInitialPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  useEffect(() => {
    draw();
  }, [stops, routes, selectedStops, editingSegment]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка
    const grid = 50;
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += grid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Маршруты с параллельным смещением
    const segmentOffsets = new Map<string, number>();
    
    routes.forEach((route, routeIndex) => {
      route.segments.forEach(segment => {
        if (segment.points.length < 2) return;

        // Вычисляем ключ сегмента для определения параллельных линий
        const segmentKey = [segment.from, segment.to].sort().join('-');
        const currentOffset = segmentOffsets.get(segmentKey) || 0;
        segmentOffsets.set(segmentKey, currentOffset + 1);
        
        const offset = currentOffset * 8 - (routes.filter(r => 
          r.segments.some(s => [s.from, s.to].sort().join('-') === segmentKey)
        ).length - 1) * 4;

        ctx.strokeStyle = route.color;
        ctx.lineWidth = route.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        
        // Рисуем с параллельным смещением
        if (segment.points.length === 2 && offset !== 0) {
          const p1 = segment.points[0];
          const p2 = segment.points[1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const perpX = -dy / len * offset;
          const perpY = dx / len * offset;
          
          ctx.moveTo(p1.x + perpX, p1.y + perpY);
          ctx.lineTo(p2.x + perpX, p2.y + perpY);
        } else {
          ctx.moveTo(segment.points[0].x, segment.points[0].y);
          for (let i = 1; i < segment.points.length; i++) {
            ctx.lineTo(segment.points[i].x, segment.points[i].y);
          }
        }
        ctx.stroke();

        // Точки редактирования
        if (
          editingSegment &&
          editingSegment.routeId === route.id &&
          editingSegment.from === segment.from &&
          editingSegment.to === segment.to
        ) {
          segment.points.forEach((point, i) => {
            ctx.fillStyle = '#F97316';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((i + 1).toString(), point.x, point.y);
          });
        }
      });
    });

    // Остановки
    stops.forEach(stop => {
      const isSelected = selectedStops.includes(stop.id);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = isSelected ? '#3B82F6' : '#1F2937';
      ctx.lineWidth = isSelected ? 4 : 3;

      const radius = stop.isTerminal ? 10 : 7;
      ctx.beginPath();
      ctx.arc(stop.x, stop.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (stop.isTerminal) {
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.arc(stop.x, stop.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Название без ID
      ctx.fillStyle = '#1F2937';
      ctx.font = '13px Inter, sans-serif';
      ctx.textBaseline = 'middle';

      let tx = stop.x, ty = stop.y - 16;
      ctx.textAlign = 'center';

      switch (stop.labelPosition) {
        case 'top': ty = stop.y - 16; ctx.textAlign = 'center'; break;
        case 'bottom': ty = stop.y + 24; ctx.textAlign = 'center'; break;
        case 'left': tx = stop.x - 16; ty = stop.y; ctx.textAlign = 'right'; break;
        case 'right': tx = stop.x + 16; ty = stop.y; ctx.textAlign = 'left'; break;
      }

      ctx.fillText(stop.name, tx, ty);
    });
  };

  const getCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findStop = (x: number, y: number) => {
    return stops.find(s => {
      const d = Math.sqrt((s.x - x) ** 2 + (s.y - y) ** 2);
      return d <= (s.isTerminal ? 10 : 7);
    });
  };

  const findPoint = (x: number, y: number) => {
    if (!editingSegment) return null;
    const route = routes.find(r => r.id === editingSegment.routeId);
    if (!route) return null;
    const segment = route.segments.find(
      s => s.from === editingSegment.from && s.to === editingSegment.to
    );
    if (!segment) return null;

    for (let i = 0; i < segment.points.length; i++) {
      const p = segment.points[i];
      const d = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
      if (d <= 8) {
        return { routeId: route.id, from: segment.from, to: segment.to, pointIndex: i };
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoords(e);

    const point = findPoint(x, y);
    if (point) {
      setIsDragging(true);
      setDragTarget({ type: 'point', ...point });
      return;
    }

    const stop = findStop(x, y);
    if (stop) {
      onStopSelect(stop.id, e.ctrlKey || e.metaKey);
      if (mode === 'select') {
        const stopsToMove = selectedStops.includes(stop.id) ? selectedStops : [stop.id];
        setIsDragging(true);
        setDragTarget({ type: 'stop', stopIds: stopsToMove });
        setDragStartPos({ x, y });
        const positions = new Map();
        stopsToMove.forEach(id => {
          const s = stops.find(st => st.id === id);
          if (s) positions.set(id, { x: s.x, y: s.y });
        });
        setInitialPositions(positions);
      }
      return;
    }

    if (mode === 'add-stop') {
      onCanvasClick(x, y);
    } else {
      onStopSelect(null, false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragTarget) return;
    const { x, y } = getCoords(e);

    if (dragTarget.type === 'stop' && dragTarget.stopIds && dragStartPos) {
      const dx = x - dragStartPos.x;
      const dy = y - dragStartPos.y;
      onStopMove(dragTarget.stopIds, dx, dy);
    } else if (
      dragTarget.type === 'point' &&
      dragTarget.routeId &&
      dragTarget.from &&
      dragTarget.to &&
      dragTarget.pointIndex !== undefined
    ) {
      onSegmentPointMove(
        dragTarget.routeId,
        dragTarget.from,
        dragTarget.to,
        dragTarget.pointIndex,
        x,
        y
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
    setDragStartPos(null);
    setInitialPositions(new Map());
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-6">
      <canvas
        ref={canvasRef}
        width={3000}
        height={2000}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="bg-white rounded-lg shadow-lg cursor-crosshair mx-auto block"
      />
    </div>
  );
};

export default SchemeCanvas;