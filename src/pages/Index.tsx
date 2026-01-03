import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Stop, Route, RouteSegment } from '@/types/transport';
import SchemeCanvas from '@/components/SchemeCanvas';
import Sidebar from '@/components/Sidebar';

const Index = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [editingSegment, setEditingSegment] = useState<{
    routeId: string;
    from: string;
    to: string;
  } | null>(null);
  const [mode, setMode] = useState<'select' | 'add-stop'>('select');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedStops.length === 0) return;
      
      const step = e.shiftKey ? 10 : 1;
      let dx = 0, dy = 0;

      switch (e.key) {
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
        default: return;
      }

      e.preventDefault();
      handleStopMove(selectedStops, dx, dy);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStops, stops]);

  const getNextStopId = () => {
    const max = stops.reduce((m, s) => Math.max(m, parseInt(s.id) || 0), 0);
    return String(max + 1).padStart(3, '0');
  };

  const handleAddStop = (name: string, x?: number, y?: number) => {
    const id = getNextStopId();
    
    let stopX = x;
    let stopY = y;
    
    if (stopX === undefined || stopY === undefined) {
      // Размещаем остановки в центре холста со смещением
      const centerX = 1500;
      const centerY = 1000;
      const offset = stops.length * 100;
      const angle = (stops.length * 45 * Math.PI) / 180;
      stopX = centerX + Math.cos(angle) * offset;
      stopY = centerY + Math.sin(angle) * offset;
    }
    
    const newStop: Stop = {
      id,
      name: name || `Остановка ${id}`,
      x: stopX,
      y: stopY,
      labelPosition: 'top',
      isTerminal: false,
    };
    setStops([...stops, newStop]);
    setSelectedStops([id]);
    toast.success('Остановка добавлена');
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
    setSelectedStops(selectedStops.filter(sid => sid !== id));
    toast.success('Остановка удалена');
  };

  const handleStopMove = (stopIds: string[], dx: number, dy: number) => {
    setStops(prev => prev.map(s => {
      if (stopIds.includes(s.id)) {
        return { ...s, x: s.x + dx, y: s.y + dy };
      }
      return s;
    }));

    setRoutes(prev => prev.map(route => ({
      ...route,
      segments: route.segments.map(seg => {
        if (stopIds.includes(seg.from) || stopIds.includes(seg.to)) {
          return {
            ...seg,
            points: seg.points.map((p, i) => {
              if (i === 0 && stopIds.includes(seg.from)) {
                return { x: p.x + dx, y: p.y + dy };
              }
              if (i === seg.points.length - 1 && stopIds.includes(seg.to)) {
                return { x: p.x + dx, y: p.y + dy };
              }
              return p;
            })
          };
        }
        return seg;
      })
    })));
  };

  const handleStopSelect = (stopId: string | null, ctrlKey: boolean) => {
    if (!stopId) {
      setSelectedStops([]);
      return;
    }
    
    if (ctrlKey) {
      setSelectedStops(prev => 
        prev.includes(stopId) 
          ? prev.filter(id => id !== stopId)
          : [...prev, stopId]
      );
    } else {
      setSelectedStops([stopId]);
    }
  };

  const handleAlignStops = (axis: 'horizontal' | 'vertical') => {
    if (selectedStops.length < 2) {
      toast.error('Выберите минимум 2 остановки');
      return;
    }

    const selectedStopsData = stops.filter(s => selectedStops.includes(s.id));
    
    if (axis === 'horizontal') {
      const avgY = selectedStopsData.reduce((sum, s) => sum + s.y, 0) / selectedStopsData.length;
      setStops(stops.map(s => 
        selectedStops.includes(s.id) ? { ...s, y: avgY } : s
      ));
      toast.success('Остановки выровнены по горизонтали');
    } else {
      const avgX = selectedStopsData.reduce((sum, s) => sum + s.x, 0) / selectedStopsData.length;
      setStops(stops.map(s => 
        selectedStops.includes(s.id) ? { ...s, x: avgX } : s
      ));
      toast.success('Остановки выровнены по вертикали');
    }
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
        selectedStops={selectedStops}
        editingSegment={editingSegment}
        mode={mode}
        onAddStop={(name) => handleAddStop(name)}
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
        onSetMode={setMode}
        onSelectStop={handleStopSelect}
        onAlignStops={handleAlignStops}
        onExport={handleExport}
        onImport={handleImport}
      />
      <SchemeCanvas
        stops={stops}
        routes={routes}
        selectedStops={selectedStops}
        editingSegment={editingSegment}
        mode={mode}
        onStopSelect={handleStopSelect}
        onStopMove={handleStopMove}
        onSegmentPointMove={handleSegmentPointMove}
        onCanvasClick={(x, y) => {
          if (mode === 'add-stop') {
            handleAddStop('', x, y);
          }
        }}
      />
    </div>
  );
};

export default Index;