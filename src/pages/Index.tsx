import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Stop, Route } from '@/types/transport';
import TransportCanvas from '@/components/TransportCanvas';
import RouteEditor from '@/components/RouteEditor';
import StopEditor from '@/components/StopEditor';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [stops, setStops] = useState<Stop[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedStops, setSelectedStops] = useState<string[]>([]);
  const [editingRoute, setEditingRoute] = useState<string | null>(null);
  const [alignMode, setAlignMode] = useState<'horizontal' | 'vertical' | null>(null);

  // Генерация следующего ID остановки
  const getNextStopId = () => {
    const maxId = stops.reduce((max, stop) => {
      const num = parseInt(stop.id);
      return num > max ? num : max;
    }, 0);
    return String(maxId + 1).padStart(3, '0');
  };

  // Добавление остановки
  const handleAddStop = (name: string) => {
    const newStop: Stop = {
      id: getNextStopId(),
      name,
      x: 100,
      y: 100,
      labelPosition: 'top',
      routes: [],
      isTerminal: false,
    };
    setStops([...stops, newStop]);
  };

  // Удаление остановки
  const handleDeleteStop = (stopId: string) => {
    setStops(stops.filter(s => s.id !== stopId));
    
    // Удаляем остановку из всех маршрутов
    setRoutes(routes.map(route => ({
      ...route,
      stops: route.stops.filter(id => id !== stopId),
    })));
    
    setSelectedStops(selectedStops.filter(id => id !== stopId));
    toast.success('Остановка удалена');
  };

  // Обновление остановки
  const handleUpdateStop = (stopId: string, updates: Partial<Stop>) => {
    setStops(stops.map(stop => 
      stop.id === stopId ? { ...stop, ...updates } : stop
    ));
  };

  // Перемещение остановки
  const handleStopDrag = (stopId: string, x: number, y: number) => {
    setStops(stops.map(stop => 
      stop.id === stopId ? { ...stop, x, y } : stop
    ));
  };

  // Выбор остановки
  const handleSelectStop = (stopId: string, multiSelect: boolean) => {
    if (multiSelect) {
      setSelectedStops(prev => 
        prev.includes(stopId) 
          ? prev.filter(id => id !== stopId)
          : [...prev, stopId]
      );
    } else {
      setSelectedStops([stopId]);
    }
  };

  // Клик по остановке на холсте
  const handleStopClick = (stopId: string) => {
    setSelectedStops([stopId]);
  };

  // Снятие выделения
  const handleClearSelection = () => {
    setSelectedStops([]);
    setAlignMode(null);
  };

  // Выравнивание остановок
  const handleAlignStops = () => {
    if (selectedStops.length < 2 || !alignMode) return;

    const firstStop = stops.find(s => s.id === selectedStops[0]);
    if (!firstStop) return;

    setStops(stops.map(stop => {
      if (selectedStops.includes(stop.id)) {
        return {
          ...stop,
          ...(alignMode === 'horizontal' ? { y: firstStop.y } : { x: firstStop.x }),
        };
      }
      return stop;
    }));

    toast.success('Остановки выровнены');
    setAlignMode(null);
  };

  // Добавление маршрута
  const handleAddRoute = (number: string, color: string, lineWidth: number, lineStyle: 'solid' | 'dashed') => {
    const newRoute: Route = {
      id: Date.now().toString(),
      number,
      color,
      lineWidth,
      lineStyle,
      stops: [],
      path: [],
    };
    setRoutes([...routes, newRoute]);
    setSelectedRoute(newRoute.id);
  };

  // Удаление маршрута
  const handleDeleteRoute = (routeId: string) => {
    setRoutes(routes.filter(r => r.id !== routeId));
    
    // Удаляем маршрут из остановок
    setStops(stops.map(stop => ({
      ...stop,
      routes: stop.routes.filter(id => id !== routeId),
    })));
    
    if (selectedRoute === routeId) setSelectedRoute(null);
    if (editingRoute === routeId) setEditingRoute(null);
    
    toast.success('Маршрут удалён');
  };

  // Обновление маршрута
  const handleUpdateRoute = (routeId: string, updates: Partial<Route>) => {
    setRoutes(routes.map(route => 
      route.id === routeId ? { ...route, ...updates } : route
    ));
  };

  // Добавление остановки к маршруту
  const handleAddStopToRoute = (routeId: string, stopId: string) => {
    setRoutes(routes.map(route => 
      route.id === routeId && !route.stops.includes(stopId)
        ? { ...route, stops: [...route.stops, stopId] }
        : route
    ));
    
    setStops(stops.map(stop => 
      stop.id === stopId && !stop.routes.includes(routeId)
        ? { ...stop, routes: [...stop.routes, routeId] }
        : stop
    ));
    
    toast.success('Остановка добавлена к маршруту');
  };

  // Удаление остановки из маршрута
  const handleRemoveStopFromRoute = (routeId: string, stopId: string) => {
    setRoutes(routes.map(route => 
      route.id === routeId
        ? { ...route, stops: route.stops.filter(id => id !== stopId) }
        : route
    ));
    
    setStops(stops.map(stop => 
      stop.id === stopId
        ? { ...stop, routes: stop.routes.filter(id => id !== routeId) }
        : stop
    ));
    
    toast.success('Остановка удалена из маршрута');
  };

  // Начать редактирование пути
  const handleStartEditingPath = (routeId: string) => {
    setEditingRoute(routeId);
    toast.info('Перетаскивайте оранжевые точки для изменения линии');
  };

  // Закончить редактирование пути
  const handleStopEditingPath = () => {
    setEditingRoute(null);
    toast.success('Редактирование завершено');
  };

  // Добавить точку пути
  const handleAddPathPoint = (routeId: string) => {
    setRoutes(routes.map(route => {
      if (route.id === routeId) {
        const lastPoint = route.path[route.path.length - 1] || { x: 100, y: 100 };
        return {
          ...route,
          path: [...route.path, { x: lastPoint.x + 50, y: lastPoint.y }],
        };
      }
      return route;
    }));
    toast.success('Точка добавлена');
  };

  // Удалить точку пути
  const handleDeletePathPoint = (routeId: string, pointIndex: number) => {
    setRoutes(routes.map(route => {
      if (route.id === routeId) {
        return {
          ...route,
          path: route.path.filter((_, index) => index !== pointIndex),
        };
      }
      return route;
    }));
    toast.success('Точка удалена');
  };

  // Перемещение точки пути
  const handlePathPointDrag = (routeId: string, pointIndex: number, x: number, y: number) => {
    setRoutes(routes.map(route => {
      if (route.id === routeId) {
        const newPath = [...route.path];
        newPath[pointIndex] = { x, y };
        return { ...route, path: newPath };
      }
      return route;
    }));
  };

  // Клик по пустому месту на холсте
  const handleCanvasClick = (x: number, y: number) => {
    // Можно добавить логику для добавления точек пути при клике
  };

  // Экспорт в JSON
  const handleExportJSON = () => {
    const data = { stops, routes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transport-scheme.json';
    link.click();
    toast.success('Схема экспортирована');
  };

  // Импорт из JSON
  const handleImportJSON = () => {
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
          toast.success('Схема импортирована');
        } catch {
          toast.error('Ошибка чтения файла');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Экспорт в PNG
  const handleExportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'transport-scheme.png';
        link.click();
        toast.success('Схема экспортирована');
      }
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Левая панель */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Редактор схем</h1>
          <p className="text-sm text-gray-500 mt-1">Транспортные маршруты</p>
        </div>

        <Tabs defaultValue="routes" className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="routes" className="flex-1">Маршруты</TabsTrigger>
            <TabsTrigger value="stops" className="flex-1">Остановки</TabsTrigger>
          </TabsList>

          <TabsContent value="routes" className="flex-1 overflow-hidden mt-4">
            <RouteEditor
              routes={routes}
              stops={stops}
              selectedRoute={selectedRoute}
              editingRoute={editingRoute}
              onSelectRoute={setSelectedRoute}
              onAddRoute={handleAddRoute}
              onDeleteRoute={handleDeleteRoute}
              onUpdateRoute={handleUpdateRoute}
              onAddStopToRoute={handleAddStopToRoute}
              onRemoveStopFromRoute={handleRemoveStopFromRoute}
              onStartEditingPath={handleStartEditingPath}
              onStopEditingPath={handleStopEditingPath}
              onAddPathPoint={handleAddPathPoint}
              onDeletePathPoint={handleDeletePathPoint}
            />
          </TabsContent>

          <TabsContent value="stops" className="flex-1 overflow-hidden mt-4">
            <StopEditor
              stops={stops}
              routes={routes}
              selectedStops={selectedStops}
              selectedRoute={selectedRoute}
              alignMode={alignMode}
              onAddStop={handleAddStop}
              onDeleteStop={handleDeleteStop}
              onUpdateStop={handleUpdateStop}
              onSelectStop={handleSelectStop}
              onClearSelection={handleClearSelection}
              onAddStopToRoute={handleAddStopToRoute}
              onRemoveStopFromRoute={handleRemoveStopFromRoute}
              onSetAlignMode={setAlignMode}
              onAlignStops={handleAlignStops}
            />
          </TabsContent>
        </Tabs>

        {/* Нижняя панель с кнопками экспорта */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button onClick={handleImportJSON} variant="outline" className="w-full" size="sm">
            <Icon name="Upload" size={14} className="mr-2" />
            Импорт JSON
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleExportJSON} variant="outline" size="sm">
              <Icon name="FileJson" size={14} className="mr-1" />
              JSON
            </Button>
            <Button onClick={handleExportPNG} variant="outline" size="sm">
              <Icon name="Download" size={14} className="mr-1" />
              PNG
            </Button>
          </div>
        </div>
      </div>

      {/* Холст */}
      <TransportCanvas
        stops={stops}
        routes={routes}
        selectedStops={selectedStops}
        selectedRoute={selectedRoute}
        editingRoute={editingRoute}
        alignMode={alignMode}
        onStopClick={handleStopClick}
        onStopDrag={handleStopDrag}
        onPathPointDrag={handlePathPointDrag}
        onCanvasClick={handleCanvasClick}
      />
    </div>
  );
};

export default Index;
