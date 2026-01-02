import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
}

interface Line {
  id: string;
  routeId: string;
  points: { x: number; y: number }[];
  color: string;
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
  const [tool, setTool] = useState<'stop' | 'line' | 'move' | 'connect'>('stop');
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

  useEffect(() => {
    drawCanvas();
  }, [stops, lines, currentLine, draggedStop, selectedStops]);

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
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let i = 1; i < line.points.length; i++) {
          ctx.lineTo(line.points[i].x, line.points[i].y);
        }
        ctx.stroke();
      }
    });

    if (currentLine.length > 1) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentLine[0].x, currentLine[0].y);
      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y);
      }
      ctx.stroke();
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
              const newLine: Line = {
                id: Date.now().toString(),
                routeId: selectedRoute,
                points: [{ x: lastStop.x, y: lastStop.y }, { x: stop.x, y: stop.y }],
                color: selectedColor,
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
    }
  };

  const handleCanvasMouseUp = () => {
    if (tool === 'line' && isDrawing && currentLine.length > 1 && selectedRoute) {
      const newLine: Line = {
        id: Date.now().toString(),
        routeId: selectedRoute,
        points: currentLine,
        color: selectedColor,
      };
      setLines([...lines, newLine]);
      setCurrentLine([]);
      setIsDrawing(false);
      toast.success('Линия добавлена');
    } else if (tool === 'move') {
      setDraggedStop(null);
    }
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
    const data = { stops, routes, lines };
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

        <div className="p-4 border-b border-gray-200">
          <Label className="text-sm font-medium mb-2 block">Инструменты</Label>
          <div className="flex gap-2">
            <Button
              variant={tool === 'stop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('stop')}
              className="flex-1"
            >
              <Icon name="MapPin" size={16} className="mr-1" />
              Остановка
            </Button>
            <Button
              variant={tool === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('line')}
              className="flex-1"
            >
              <Icon name="Pencil" size={16} className="mr-1" />
              Линия
            </Button>
            <Button
              variant={tool === 'move' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool('move')}
              className="flex-1"
            >
              <Icon name="Move" size={16} className="mr-1" />
              Перемещение
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant={tool === 'connect' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTool('connect');
                setSelectedStops([]);
              }}
              className="flex-1"
            >
              <Icon name="Link" size={16} className="mr-1" />
              Связать
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStops([])}
              className="flex-1"
              disabled={selectedStops.length === 0}
            >
              <Icon name="X" size={16} className="mr-1" />
              Сброс
            </Button>
          </div>
        </div>

        {tool === 'stop' && (
          <div className="p-4 border-b border-gray-200">
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

        <div className="p-4 border-b border-gray-200">
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

        <div className="p-4 border-b border-gray-200">
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

        <ScrollArea className="flex-1">
          <div className="p-4">
            <Label className="text-sm font-medium mb-3 block">Маршруты</Label>
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
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: route.color }}
                    />
                    <span className="font-medium">№{route.number}</span>
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

            <Separator className="my-4" />

            <Label className="text-sm font-medium mb-3 block">Остановки</Label>
            <div className="space-y-2">
              {stops.map((stop) => (
                <Card key={stop.id} className="p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="MapPin" size={14} className="text-gray-500" />
                      <span className="text-sm">{stop.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => setSelectedStopForLabel(stop.id)}
                    >
                      <Icon name="AlignCenter" size={12} />
                    </Button>
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
        </ScrollArea>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button onClick={exportToPNG} className="w-full" variant="default">
            <Icon name="Download" size={16} className="mr-2" />
            Экспорт в PNG
          </Button>
          <Button onClick={exportToJSON} className="w-full" variant="outline">
            <Icon name="FileJson" size={16} className="mr-2" />
            Экспорт в JSON
          </Button>
        </div>
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