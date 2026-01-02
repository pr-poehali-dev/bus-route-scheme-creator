import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Stop, Route, Line, COLORS } from '@/types/transport';
import TransportCanvas from '@/components/TransportCanvas';
import ToolsPanel from '@/components/ToolsPanel';
import RoutesPanel from '@/components/RoutesPanel';
import SettingsPanel from '@/components/SettingsPanel';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'stop' | 'line' | 'move' | 'connect' | 'delete' | 'edit'>('stop');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [currentLine, setCurrentLine] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedStop, setDraggedStop] = useState<string | null>(null);
  const [newStopName, setNewStopName] = useState('');
  const [newRouteNumber, setNewRouteNumber] = useState('');
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [selectedStopForLabel, setSelectedStopForLabel] = useState<string | null>(null);
  const [lineWidth] = useState(4);
  const [lineStyle] = useState<'solid' | 'dashed'>('solid');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [draggedPoint, setDraggedPoint] = useState<{ lineId: string; pointIndex: number } | null>(null);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current || (e.target as HTMLCanvasElement);
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
      return distance <= 10;
    }) || null;
  };

  const findLineAtPosition = (x: number, y: number): Line | null => {
    for (const line of lines) {
      for (let i = 0; i < line.points.length - 1; i++) {
        const p1 = line.points[i];
        const p2 = line.points[i + 1];
        const dist = pointToSegmentDistance(x, y, p1.x, p1.y, p2.x, p2.y);
        if (dist < 10) {
          return line;
        }
      }
    }
    return null;
  };

  const pointToSegmentDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (tool === 'stop') {
      if (!newStopName.trim()) {
        toast.error('Введите название остановки');
        return;
      }

      const newStop: Stop = {
        id: Date.now().toString(),
        name: newStopName,
        x,
        y,
        labelPosition: 'top',
      };
      setStops([...stops, newStop]);
      setNewStopName('');
      toast.success(`Остановка "${newStopName}" добавлена`);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (tool === 'line') {
      if (!selectedRoute) {
        toast.error('Выберите маршрут');
        return;
      }
      setIsDrawing(true);
      setCurrentLine([{ x, y }]);
    } else if (tool === 'move') {
      const stop = findStopAtPosition(x, y);
      if (stop) {
        setDraggedStop(stop.id);
      }
    } else if (tool === 'delete') {
      const stop = findStopAtPosition(x, y);
      if (stop) {
        deleteStop(stop.id);
      } else {
        const line = findLineAtPosition(x, y);
        if (line) {
          deleteLine(line.id);
        }
      }
    } else if (tool === 'edit') {
      let pointClicked = false;
      
      if (selectedLine) {
        const line = lines.find(l => l.id === selectedLine);
        if (line) {
          for (let i = 0; i < line.points.length; i++) {
            const p = line.points[i];
            if (Math.abs(p.x - x) < 10 && Math.abs(p.y - y) < 10) {
              setDraggedPoint({ lineId: line.id, pointIndex: i });
              pointClicked = true;
              return;
            }
          }
        }
      }
      
      if (!pointClicked) {
        const line = findLineAtPosition(x, y);
        if (line) {
          setSelectedLine(line.id);
          toast.success('Линия выбрана. Перетаскивайте оранжевые точки');
        } else {
          setSelectedLine(null);
        }
      }
    } else if (tool === 'connect') {
      const stop = findStopAtPosition(x, y);
      if (stop) {
        if (!selectedRoute) {
          toast.error('Выберите маршрут');
          return;
        }
        
        if (selectedStops.includes(stop.id)) {
          setSelectedStops(selectedStops.filter(id => id !== stop.id));
        } else {
          setSelectedStops([...selectedStops, stop.id]);
          
          if (selectedStops.length > 0) {
            const lastStopId = selectedStops[selectedStops.length - 1];
            const lastStop = stops.find(s => s.id === lastStopId);
            if (lastStop) {
              const existingLine = lines.find(line => 
                (Math.abs(line.points[0].x - lastStop.x) < 5 && Math.abs(line.points[0].y - lastStop.y) < 5 &&
                 Math.abs(line.points[line.points.length - 1].x - stop.x) < 5 && Math.abs(line.points[line.points.length - 1].y - stop.y) < 5) ||
                (Math.abs(line.points[0].x - stop.x) < 5 && Math.abs(line.points[0].y - stop.y) < 5 &&
                 Math.abs(line.points[line.points.length - 1].x - lastStop.x) < 5 && Math.abs(line.points[line.points.length - 1].y - lastStop.y) < 5)
              );
              
              const offset = existingLine ? (existingLine.offset || 0) + 8 : 0;
              
              const newLine: Line = {
                id: Date.now().toString(),
                routeId: selectedRoute,
                points: [{ x: lastStop.x, y: lastStop.y }, { x: stop.x, y: stop.y }],
                color: selectedColor,
                lineWidth: 4,
                lineStyle: 'solid',
                offset: offset,
              };
              setLines([...lines, newLine]);
              addStopToRoute(selectedRoute, stop.id);
            }
          } else {
            addStopToRoute(selectedRoute, stop.id);
          }
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (tool === 'line' && isDrawing) {
      setCurrentLine([...currentLine, { x, y }]);
    } else if (tool === 'move' && draggedStop) {
      setStops(
        stops.map((stop) =>
          stop.id === draggedStop ? { ...stop, x, y } : stop
        )
      );
    } else if (tool === 'edit' && draggedPoint) {
      setLines(
        lines.map((line) => {
          if (line.id === draggedPoint.lineId) {
            const newPoints = [...line.points];
            newPoints[draggedPoint.pointIndex] = { x, y };
            return { ...line, points: newPoints };
          }
          return line;
        })
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (tool === 'line' && isDrawing && currentLine.length > 1 && selectedRoute) {
      const newLine: Line = {
        id: Date.now().toString(),
        routeId: selectedRoute,
        points: currentLine,
        color: selectedColor,
        lineWidth: 4,
        lineStyle: 'solid',
        offset: 0,
      };
      setLines([...lines, newLine]);
      setCurrentLine([]);
      setIsDrawing(false);
      toast.success('Линия добавлена');
    } else if (tool === 'move') {
      setDraggedStop(null);
    } else if (tool === 'edit') {
      setDraggedPoint(null);
    }
  };

  const deleteStop = (stopId: string) => {
    setStops(stops.filter(s => s.id !== stopId));
    setRoutes(routes.map(r => ({
      ...r,
      stops: r.stops.filter(id => id !== stopId)
    })));
    setLines(lines.filter(line => {
      const stopToDelete = stops.find(s => s.id === stopId);
      if (!stopToDelete) return true;
      
      return !line.points.some(p => 
        Math.abs(p.x - stopToDelete.x) < 5 && Math.abs(p.y - stopToDelete.y) < 5
      );
    }));
    toast.success('Остановка удалена');
  };

  const deleteLine = (lineId: string) => {
    setLines(lines.filter(l => l.id !== lineId));
    toast.success('Линия удалена');
  };

  const deleteRoute = (routeId: string) => {
    setRoutes(routes.filter(r => r.id !== routeId));
    setLines(lines.filter(l => l.routeId !== routeId));
    if (selectedRoute === routeId) {
      setSelectedRoute(null);
    }
    toast.success('Маршрут удалён');
  };

  const addRoute = () => {
    if (!newRouteNumber.trim()) {
      toast.error('Введите номер маршрута');
      return;
    }

    const newRoute: Route = {
      id: Date.now().toString(),
      number: newRouteNumber,
      color: selectedColor,
      stops: [],
      lineWidth: 4,
      lineStyle: 'solid',
    };
    setRoutes([...routes, newRoute]);
    setSelectedRoute(newRoute.id);
    setNewRouteNumber('');
    toast.success(`Маршрут №${newRouteNumber} создан`);
  };

  const addStopToRoute = (routeId: string, stopId: string) => {
    setRoutes(
      routes.map((route) => {
        if (route.id === routeId && !route.stops.includes(stopId)) {
          return { ...route, stops: [...route.stops, stopId] };
        }
        return route;
      })
    );
  };

  const changeLabelPosition = (stopId: string, position: 'top' | 'bottom' | 'left' | 'right') => {
    setStops(
      stops.map((stop) =>
        stop.id === stopId ? { ...stop, labelPosition: position } : stop
      )
    );
    setSelectedStopForLabel(null);
    toast.success('Позиция названия изменена');
  };

  const exportToJSON = () => {
    const data = {
      version: '1.0',
      stops,
      routes,
      lines,
      settings: {
        colors: COLORS,
        defaultLineWidth: lineWidth,
        defaultLineStyle: lineStyle,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transport-scheme.json';
    link.click();
    toast.success('Схема экспортирована в JSON');
  };

  const importFromJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          if (data.stops) setStops(data.stops);
          if (data.routes) setRoutes(data.routes);
          if (data.lines) setLines(data.lines);
          
          toast.success('Схема импортирована');
        } catch (error) {
          toast.error('Ошибка чтения файла');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportToPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'transport-scheme.png';
        link.click();
        toast.success('Схема экспортирована в PNG');
      }
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Редактор схем</h1>
          <p className="text-sm text-gray-500 mt-1">Транспортные маршруты</p>
        </div>

        <Tabs defaultValue="tools" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="tools" className="flex-1">Инструменты</TabsTrigger>
            <TabsTrigger value="routes" className="flex-1">Маршруты</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="flex-1 overflow-hidden">
            <ToolsPanel
              tool={tool}
              setTool={setTool}
              newStopName={newStopName}
              setNewStopName={setNewStopName}
              selectedStops={selectedStops}
              setSelectedStops={setSelectedStops}
              selectedLine={selectedLine}
              setSelectedLine={setSelectedLine}
              stops={stops}
              deleteStop={deleteStop}
              changeLabelPosition={changeLabelPosition}
              selectedStopForLabel={selectedStopForLabel}
              setSelectedStopForLabel={setSelectedStopForLabel}
            />
          </TabsContent>

          <TabsContent value="routes" className="flex-1 overflow-hidden">
            <RoutesPanel
              routes={routes}
              stops={stops}
              newRouteNumber={newRouteNumber}
              setNewRouteNumber={setNewRouteNumber}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              addRoute={addRoute}
              deleteRoute={deleteRoute}
              addStopToRoute={addStopToRoute}
            />
          </TabsContent>

          <TabsContent value="settings" className="flex-1 overflow-hidden">
            <SettingsPanel
              importFromJSON={importFromJSON}
              exportToJSON={exportToJSON}
              exportToPNG={exportToPNG}
            />
          </TabsContent>
        </Tabs>
      </div>

      <TransportCanvas
        stops={stops}
        lines={lines}
        currentLine={currentLine}
        selectedStops={selectedStops}
        selectedColor={selectedColor}
        lineWidth={lineWidth}
        lineStyle={lineStyle}
        selectedLine={selectedLine}
        tool={tool}
        onCanvasClick={handleCanvasClick}
        onCanvasMouseDown={handleCanvasMouseDown}
        onCanvasMouseMove={handleCanvasMouseMove}
        onCanvasMouseUp={handleCanvasMouseUp}
      />
    </div>
  );
};

export default Index;
