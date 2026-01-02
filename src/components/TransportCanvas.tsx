import { useRef, useEffect, useState } from 'react';
import { Stop, Route } from '@/types/transport';

interface TransportCanvasProps {
  stops: Stop[];
  routes: Route[];
  selectedStops: string[];
  selectedRoute: string | null;
  editingRoute: string | null;
  alignMode: 'horizontal' | 'vertical' | null;
  onStopClick: (stopId: string) => void;
  onStopDrag: (stopId: string, x: number, y: number) => void;
  onPathPointDrag: (routeId: string, pointIndex: number, x: number, y: number) => void;
  onCanvasClick: (x: number, y: number) => void;
}

const TransportCanvas = ({
  stops,
  routes,
  selectedStops,
  selectedRoute,
  editingRoute,
  alignMode,
  onStopClick,
  onStopDrag,
  onPathPointDrag,
  onCanvasClick,
}: TransportCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<{ type: 'stop' | 'path'; id: string; pointIndex?: number } | null>(null);

  useEffect(() => {
    drawCanvas();
  }, [stops, routes, selectedStops, editingRoute, alignMode, selectedRoute]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Фон
    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка
    const gridSize = 50;
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Линии выравнивания
    if (alignMode && selectedStops.length > 0) {
      const firstStop = stops.find(s => s.id === selectedStops[0]);
      if (firstStop) {
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        if (alignMode === 'horizontal') {
          ctx.moveTo(0, firstStop.y);
          ctx.lineTo(canvas.width, firstStop.y);
        } else {
          ctx.moveTo(firstStop.x, 0);
          ctx.lineTo(firstStop.x, canvas.height);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Рисуем маршруты
    routes.forEach((route) => {
      if (route.path.length > 1) {
        ctx.strokeStyle = route.color;
        ctx.lineWidth = route.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (route.lineStyle === 'dashed') {
          ctx.setLineDash([10, 5]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.beginPath();
        ctx.moveTo(route.path[0].x, route.path[0].y);
        for (let i = 1; i < route.path.length; i++) {
          ctx.lineTo(route.path[i].x, route.path[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Если маршрут редактируется, показываем точки пути
        if (editingRoute === route.id) {
          route.path.forEach((point, index) => {
            ctx.fillStyle = '#F97316';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Номер точки
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((index + 1).toString(), point.x, point.y);
          });
        }
      }
    });

    // Рисуем остановки
    stops.forEach((stop) => {
      const isSelected = selectedStops.includes(stop.id);
      const belongsToSelectedRoute = selectedRoute && stop.routes.includes(selectedRoute);
      
      // Основной круг остановки
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = belongsToSelectedRoute ? routes.find(r => r.id === selectedRoute)?.color || '#1A1F2C' : '#1A1F2C';
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.beginPath();
      ctx.arc(stop.x, stop.y, stop.isTerminal ? 12 : 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Внутренний круг для конечных остановок
      if (stop.isTerminal) {
        ctx.fillStyle = belongsToSelectedRoute ? routes.find(r => r.id === selectedRoute)?.color || '#1A1F2C' : '#1A1F2C';
        ctx.beginPath();
        ctx.arc(stop.x, stop.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Название остановки
      ctx.fillStyle = '#1A1F2C';
      ctx.font = '13px Roboto, sans-serif';
      
      let textX = stop.x;
      let textY = stop.y - 18;
      ctx.textAlign = 'center';
      
      switch (stop.labelPosition) {
        case 'top':
          textY = stop.y - 18;
          ctx.textAlign = 'center';
          break;
        case 'bottom':
          textY = stop.y + 28;
          ctx.textAlign = 'center';
          break;
        case 'left':
          textX = stop.x - 18;
          textY = stop.y + 4;
          ctx.textAlign = 'right';
          break;
        case 'right':
          textX = stop.x + 18;
          textY = stop.y + 4;
          ctx.textAlign = 'left';
          break;
      }
      
      ctx.fillText(`${stop.id} ${stop.name}`, textX, textY);
    });
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findStopAtPosition = (x: number, y: number): Stop | null => {
    return stops.find((stop) => {
      const distance = Math.sqrt((stop.x - x) ** 2 + (stop.y - y) ** 2);
      return distance <= (stop.isTerminal ? 12 : 8);
    }) || null;
  };

  const findPathPointAtPosition = (x: number, y: number): { routeId: string; pointIndex: number } | null => {
    if (!editingRoute) return null;
    
    const route = routes.find(r => r.id === editingRoute);
    if (!route) return null;

    for (let i = 0; i < route.path.length; i++) {
      const point = route.path[i];
      const distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
      if (distance <= 8) {
        return { routeId: route.id, pointIndex: i };
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    // Проверяем клик по точке пути (приоритет)
    const pathPoint = findPathPointAtPosition(x, y);
    if (pathPoint) {
      setIsDragging(true);
      setDragTarget({ type: 'path', id: pathPoint.routeId, pointIndex: pathPoint.pointIndex });
      return;
    }

    // Проверяем клик по остановке
    const stop = findStopAtPosition(x, y);
    if (stop) {
      onStopClick(stop.id);
      setIsDragging(true);
      setDragTarget({ type: 'stop', id: stop.id });
      return;
    }

    // Клик по пустому месту
    onCanvasClick(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragTarget) return;

    const { x, y } = getCanvasCoordinates(e);

    if (dragTarget.type === 'stop') {
      onStopDrag(dragTarget.id, x, y);
    } else if (dragTarget.type === 'path' && dragTarget.pointIndex !== undefined) {
      onPathPointDrag(dragTarget.id, dragTarget.pointIndex, x, y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTarget(null);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-100">
      <canvas
        ref={canvasRef}
        width={2400}
        height={1600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="bg-white rounded-lg shadow-lg cursor-crosshair"
      />
    </div>
  );
};

export default TransportCanvas;
