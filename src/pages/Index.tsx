import { useState } from 'react';
import { toast } from 'sonner';
import { Stop, Route, RouteSegment } from '@/types/transport';
import SchemeCanvas from '@/components/SchemeCanvas';
import Sidebar from '@/components/Sidebar';

const Index = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const [editingSegment, setEditingSegment] = useState<{
    routeId: string;
    from: string;
    to: string;
  } | null>(null);

  const getNextStopId = () => {
    const max = stops.reduce((m, s) => Math.max(m, parseInt(s.id) || 0), 0);
    return String(max + 1).padStart(3, '0');
  };

  const handleAddStop = (name: string) => {
    const id = getNextStopId();
    
    // Размещаем остановки в центре холста со смещением
    const centerX = 1500;
    const centerY = 1000;
    const offset = stops.length * 100;
    const angle = (stops.length * 45 * Math.PI) / 180;
    
    const newStop: Stop = {
      id,
      name,
      x: centerX + Math.cos(angle) * offset,
      y: centerY + Math.sin(angle) * offset,
      labelPosition: 'top',
      isTerminal: false,
    };
    setStops([...stops, newStop]);
  };

  const handleUpdateStop = (id: string, updates: Partial<Stop>) => {
    setStops(stops.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleDeleteStop = (id: string) => {
    setStops(stops.filter(s => s.id !== id));
    setRoutes(
      routes.map(r => ({
        ...r,
        stops: r.stops.filter(sid => sid !== id),
        segments: r.segments.filter(seg => seg.from !== id && seg.to !== id),
      }))
    );
    if (selectedStop === id) setSelectedStop(null);
    toast.success('Остановка удалена');
  };

  const handleStopMove = (id: string, x: number, y: number) => {
    setStops(stops.map(s => (s.id === id ? { ...s, x, y } : s)));
  };

  const handleAddRoute = (number: string, name: string, color: string, width: number) => {
    const newRoute: Route = {
      id: Date.now().toString(),
      number,
      name,
      color,
      lineWidth: width,
      stops: [],
      segments: [],
    };
    setRoutes([...routes, newRoute]);
  };

  const handleUpdateRoute = (id: string, updates: Partial<Route>) => {
    setRoutes(routes.map(r => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
    if (editingSegment?.routeId === id) setEditingSegment(null);
    toast.success('Маршрут удалён');
  };

  const handleAddStopToRoute = (routeId: string, stopId: string) => {
    setRoutes(
      routes.map(r => {
        if (r.id !== routeId) return r;

        const newStops = [...r.stops, stopId];
        const newSegments = [...r.segments];

        if (newStops.length >= 2) {
          const prevStopId = newStops[newStops.length - 2];
          const prevStop = stops.find(s => s.id === prevStopId);
          const currentStop = stops.find(s => s.id === stopId);

          if (prevStop && currentStop) {
            newSegments.push({
              from: prevStopId,
              to: stopId,
              points: [
                { x: prevStop.x, y: prevStop.y },
                { x: currentStop.x, y: currentStop.y },
              ],
            });
          }
        }

        return { ...r, stops: newStops, segments: newSegments };
      })
    );
    toast.success('Остановка добавлена');
  };

  const handleRemoveStopFromRoute = (routeId: string, stopId: string) => {
    setRoutes(
      routes.map(r => {
        if (r.id !== routeId) return r;
        const newStops = r.stops.filter(sid => sid !== stopId);
        const newSegments = r.segments.filter(seg => seg.from !== stopId && seg.to !== stopId);
        return { ...r, stops: newStops, segments: newSegments };
      })
    );
    toast.success('Остановка удалена из маршрута');
  };

  const handleReorderStops = (routeId: string, stopIds: string[]) => {
    setRoutes(
      routes.map(r => {
        if (r.id !== routeId) return r;
        return { ...r, stops: stopIds };
      })
    );
  };

  const handleEditSegment = (routeId: string, from: string, to: string) => {
    setEditingSegment({ routeId, from, to });
    toast.info('Перетаскивайте оранжевые точки');
  };

  const handleStopEditingSegment = () => {
    setEditingSegment(null);
    toast.success('Редактирование завершено');
  };

  const handleAddSegmentPoint = (routeId: string, from: string, to: string) => {
    setRoutes(
      routes.map(r => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          segments: r.segments.map(seg => {
            if (seg.from === from && seg.to === to) {
              const lastPoint = seg.points[seg.points.length - 1];
              return {
                ...seg,
                points: [...seg.points, { x: lastPoint.x + 50, y: lastPoint.y }],
              };
            }
            return seg;
          }),
        };
      })
    );
    toast.success('Точка добавлена');
  };

  const handleDeleteSegmentPoint = (
    routeId: string,
    from: string,
    to: string,
    index: number
  ) => {
    setRoutes(
      routes.map(r => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          segments: r.segments.map(seg => {
            if (seg.from === from && seg.to === to) {
              return { ...seg, points: seg.points.filter((_, i) => i !== index) };
            }
            return seg;
          }),
        };
      })
    );
    toast.success('Точка удалена');
  };

  const handleSegmentPointMove = (
    routeId: string,
    from: string,
    to: string,
    pointIndex: number,
    x: number,
    y: number
  ) => {
    setRoutes(
      routes.map(r => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          segments: r.segments.map(seg => {
            if (seg.from === from && seg.to === to) {
              const newPoints = [...seg.points];
              newPoints[pointIndex] = { x, y };
              return { ...seg, points: newPoints };
            }
            return seg;
          }),
        };
      })
    );
  };

  const handleAutoRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route || route.stops.length < 2) {
      toast.error('Добавьте хотя бы 2 остановки');
      return;
    }

    const newSegments: RouteSegment[] = [];
    for (let i = 0; i < route.stops.length - 1; i++) {
      const fromStop = stops.find(s => s.id === route.stops[i]);
      const toStop = stops.find(s => s.id === route.stops[i + 1]);
      if (fromStop && toStop) {
        newSegments.push({
          from: fromStop.id,
          to: toStop.id,
          points: [
            { x: fromStop.x, y: fromStop.y },
            { x: toStop.x, y: toStop.y },
          ],
        });
      }
    }

    setRoutes(routes.map(r => (r.id === routeId ? { ...r, segments: newSegments } : r)));
    toast.success('Путь построен автоматически');
  };

  const handleExport = () => {
    const data = { stops, routes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scheme.json';
    a.click();
    toast.success('Схема экспортирована');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.stops) setStops(data.stops);
          if (data.routes) setRoutes(data.routes);
          toast.success('Схема импортирована');
        } catch {
          toast.error('Ошибка чтения файла');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        stops={stops}
        routes={routes}
        selectedStop={selectedStop}
        editingSegment={editingSegment}
        onAddStop={handleAddStop}
        onUpdateStop={handleUpdateStop}
        onDeleteStop={handleDeleteStop}
        onAddRoute={handleAddRoute}
        onUpdateRoute={handleUpdateRoute}
        onDeleteRoute={handleDeleteRoute}
        onAddStopToRoute={handleAddStopToRoute}
        onRemoveStopFromRoute={handleRemoveStopFromRoute}
        onReorderStops={handleReorderStops}
        onEditSegment={handleEditSegment}
        onStopEditingSegment={handleStopEditingSegment}
        onAddSegmentPoint={handleAddSegmentPoint}
        onDeleteSegmentPoint={handleDeleteSegmentPoint}
        onAutoRoute={handleAutoRoute}
        onExport={handleExport}
        onImport={handleImport}
      />
      <SchemeCanvas
        stops={stops}
        routes={routes}
        selectedStop={selectedStop}
        editingSegment={editingSegment}
        onStopSelect={setSelectedStop}
        onStopMove={handleStopMove}
        onSegmentPointMove={handleSegmentPointMove}
      />
    </div>
  );
};

export default Index;