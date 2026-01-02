import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Stop {
  id: string;
  name: string;
  x: number;
  y: number;
  labelPosition: 'top' | 'bottom' | 'left' | 'right';
}

interface Route {
  id: string;
  number: string;
  color: string;
  stops: string[];
  lineWidth: number;
  lineStyle: 'solid' | 'dashed';
}

interface Line {
  id: string;
  routeId: string;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed';
  offset?: number;
}

const COLORS = [
  '#0EA5E9',
  '#8B5CF6',
  '#F97316',
  '#10B981',
  '#EC4899',
  '#EAB308',
  '#06B6D4',
  '#F43F5E',
];

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
  const [lineWidth, setLineWidth] = useState(4);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed'>('solid');
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [draggedPoint, setDraggedPoint] = useState<{ lineId: string; pointIndex: number } | null>(null);

  useEffect(() => {
    drawCanvas();
  }, [stops, lines, currentLine, draggedStop, selectedStops, lineWidth, lineStyle, selectedLine, draggedPoint]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 40;
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

    lines.forEach((line) => {
      if (line.points.length > 1) {
        const offset = line.offset || 0;
        const isSelected = selectedLine === line.id;
        
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (line.lineStyle === 'dashed') {
          ctx.setLineDash([10, 5]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.beginPath();
        if (offset === 0) {
          ctx.moveTo(line.points[0].x, line.points[0].y);
          for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(line.points[i].x, line.points[i].y);
          }
        } else {
          const offsetPoints = line.points.map((p, i) => {
            if (i === 0 || i === line.points.length - 1) return p;
            const prev = line.points[i - 1];
            const next = line.points[i + 1];
            const dx1 = p.x - prev.x;
            const dy1 = p.y - prev.y;
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const dx2 = next.x - p.x;
            const dy2 = next.y - p.y;
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            const perpX = -(dy1 / len1 + dy2 / len2) / 2;
            const perpY = (dx1 / len1 + dx2 / len2) / 2;
            return { x: p.x + perpX * offset, y: p.y + perpY * offset };
          });
          ctx.moveTo(offsetPoints[0].x, offsetPoints[0].y);
          for (let i = 1; i < offsetPoints.length; i++) {
            ctx.lineTo(offsetPoints[i].x, offsetPoints[i].y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        if (isSelected && tool === 'edit') {
          line.points.forEach((point) => {
            ctx.fillStyle = '#F97316';
            ctx.fillRect(point.x - 4, point.y - 4, 8, 8);
          });
        }
      }
    });

    if (currentLine.length > 1) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (lineStyle === 'dashed') {
        ctx.setLineDash([10, 5]);
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.beginPath();
      ctx.moveTo(currentLine[0].x, currentLine[0].y);
      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    stops.forEach((stop) => {
      const isSelected = selectedStops.includes(stop.id);
      
      ctx.fillStyle = isSelected ? selectedColor : '#FFFFFF';
      ctx.strokeStyle = '#1A1F2C';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(stop.x, stop.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1A1F2C';
      ctx.font = '12px Roboto';
      
      let textX = stop.x;
      let textY = stop.y - 15;
      ctx.textAlign = 'center';
      
      switch (stop.labelPosition) {
        case 'top':
          textY = stop.y - 15;
          ctx.textAlign = 'center';
          break;
        case 'bottom':
          textY = stop.y + 25;
          ctx.textAlign = 'center';
          break;
        case 'left':
          textX = stop.x - 15;
          textY = stop.y + 4;
          ctx.textAlign = 'right';
          break;
        case 'right':
          textX = stop.x + 15;
          textY = stop.y + 4;
          ctx.textAlign = 'left';
          break;
      }
      
      ctx.fillText(stop.name, textX, textY);
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
      return distance <= 10;
    }) || null;
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
      if (selectedLine) {
        const line = lines.find(l => l.id === selectedLine);
        if (line) {
          for (let i = 0; i < line.points.length; i++) {
            const p = line.points[i];
            if (Math.abs(p.x - x) < 8 && Math.abs(p.y - y) < 8) {
              setDraggedPoint({ lineId: line.id, pointIndex: i });
              return;
            }
          }
        }
      }
      const line = findLineAtPosition(x, y);
      if (line) {
        setSelectedLine(line.id);
        toast.success('Линия выбрана. Перетаскивайте оранжевые точки');
      } else {
        setSelectedLine(null);
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
                lineWidth: lineWidth,
                lineStyle: lineStyle,
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
        lineWidth: lineWidth,
        lineStyle: lineStyle,
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
      lineWidth: lineWidth,
      lineStyle: lineStyle,
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
          if (data.settings) {
            if (data.settings.defaultLineWidth) setLineWidth(data.settings.defaultLineWidth);
            if (data.settings.defaultLineStyle) setLineStyle(data.settings.defaultLineStyle);
          }
          
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
    const canvas = canvasRef.current;
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
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Основные</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={tool === 'stop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTool('stop')}
                    >
                      <Icon name="MapPin" size={16} className="mr-1" />
                      Остановка
                    </Button>
                    <Button
                      variant={tool === 'line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTool('line')}
                    >
                      <Icon name="Pencil" size={16} className="mr-1" />
                      Линия
                    </Button>
                    <Button
                      variant={tool === 'connect' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setTool('connect');
                        setSelectedStops([]);
                      }}
                    >
                      <Icon name="Link" size={16} className="mr-1" />
                      Связать
                    </Button>
                    <Button
                      variant={tool === 'move' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTool('move')}
                    >
                      <Icon name="Move" size={16} className="mr-1" />
                      Перемещение
                    </Button>
                    <Button
                      variant={tool === 'edit' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTool('edit')}
                    >
                      <Icon name="Edit" size={16} className="mr-1" />
                      Редактировать
                    </Button>
                    <Button
                      variant={tool === 'delete' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTool('delete')}
                    >
                      <Icon name="Trash2" size={16} className="mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>

                {tool === 'stop' && (
                  <div>
                    <Label htmlFor="stop-name" className="text-sm font-medium">
                      Название остановки
                    </Label>
                    <Input
                      id="stop-name"
                      value={newStopName}
                      onChange={(e) => setNewStopName(e.target.value)}
                      placeholder="Например: Центральная"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Кликните на карту для добавления
                    </p>
                  </div>
                )}

                {tool === 'connect' && selectedStops.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Выбрано остановок: {selectedStops.length}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStops([])}
                      className="w-full mt-2"
                    >
                      <Icon name="X" size={16} className="mr-1" />
                      Сбросить выбор
                    </Button>
                  </div>
                )}

                {tool === 'edit' && selectedLine && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Редактирование линии</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Перетаскивайте оранжевые точки для изменения формы линии
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLine(null);
                        setTool('stop');
                      }}
                      className="w-full"
                    >
                      Завершить редактирование
                    </Button>
                  </div>
                )}

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Остановки</Label>
                  <div className="space-y-2">
                    {stops.map((stop) => (
                      <Card key={stop.id} className="p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon name="MapPin" size={14} className="text-gray-500" />
                            <span className="text-sm">{stop.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                              onClick={() => setSelectedStopForLabel(stop.id)}
                            >
                              <Icon name="AlignCenter" size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2"
                              onClick={() => deleteStop(stop.id)}
                            >
                              <Icon name="Trash2" size={12} className="text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {selectedStopForLabel === stop.id && (
                          <div className="mt-2 grid grid-cols-4 gap-1">
                            <Button
                              size="sm"
                              variant={stop.labelPosition === 'top' ? 'default' : 'outline'}
                              className="text-xs h-7"
                              onClick={() => changeLabelPosition(stop.id, 'top')}
                            >
                              <Icon name="ArrowUp" size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant={stop.labelPosition === 'bottom' ? 'default' : 'outline'}
                              className="text-xs h-7"
                              onClick={() => changeLabelPosition(stop.id, 'bottom')}
                            >
                              <Icon name="ArrowDown" size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant={stop.labelPosition === 'left' ? 'default' : 'outline'}
                              className="text-xs h-7"
                              onClick={() => changeLabelPosition(stop.id, 'left')}
                            >
                              <Icon name="ArrowLeft" size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant={stop.labelPosition === 'right' ? 'default' : 'outline'}
                              className="text-xs h-7"
                              onClick={() => changeLabelPosition(stop.id, 'right')}
                            >
                              <Icon name="ArrowRight" size={12} />
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="routes" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Новый маршрут</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newRouteNumber}
                      onChange={(e) => setNewRouteNumber(e.target.value)}
                      placeholder="№ маршрута"
                      className="flex-1"
                    />
                    <Button onClick={addRoute} size="sm">
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Список маршрутов</Label>
                  <div className="space-y-2">
                    {routes.map((route) => (
                      <Card
                        key={route.id}
                        className={`p-3 cursor-pointer transition-all ${
                          selectedRoute === route.id
                            ? 'ring-2 ring-gray-900'
                            : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedRoute(route.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: route.color }}
                            />
                            <span className="font-medium">№{route.number}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoute(route.id);
                            }}
                          >
                            <Icon name="Trash2" size={12} className="text-red-500" />
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Остановок: {route.stops.length}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {stops
                            .filter((stop) => !route.stops.includes(stop.id))
                            .map((stop) => (
                              <Button
                                key={stop.id}
                                size="sm"
                                variant="outline"
                                className="text-xs h-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addStopToRoute(route.id, stop.id);
                                }}
                              >
                                + {stop.name}
                              </Button>
                            ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Цвет линии</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-full h-10 rounded-lg transition-all ${
                          selectedColor === color
                            ? 'ring-2 ring-offset-2 ring-gray-900 scale-105'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Толщина линии</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-8">{lineWidth}px</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Стиль линии</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={lineStyle === 'solid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLineStyle('solid')}
                      className="flex-1"
                    >
                      <Icon name="Minus" size={16} className="mr-1" />
                      Сплошная
                    </Button>
                    <Button
                      variant={lineStyle === 'dashed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLineStyle('dashed')}
                      className="flex-1"
                    >
                      <Icon name="Grip" size={16} className="mr-1" />
                      Пунктир
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Импорт/Экспорт</Label>
                  <div className="space-y-2">
                    <Button onClick={importFromJSON} className="w-full" variant="outline">
                      <Icon name="Upload" size={16} className="mr-2" />
                      Импорт из JSON
                    </Button>
                    <Button onClick={exportToJSON} className="w-full" variant="outline">
                      <Icon name="FileJson" size={16} className="mr-2" />
                      Экспорт в JSON
                    </Button>
                    <Button onClick={exportToPNG} className="w-full" variant="default">
                      <Icon name="Download" size={16} className="mr-2" />
                      Экспорт в PNG
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="bg-white rounded-lg shadow-lg cursor-crosshair"
        />
      </div>
    </div>
  );
};

export default Index;