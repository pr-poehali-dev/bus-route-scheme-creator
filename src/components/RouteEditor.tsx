import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Route, Stop, COLORS, LINE_WIDTHS } from '@/types/transport';
import { toast } from 'sonner';

interface RouteEditorProps {
  routes: Route[];
  stops: Stop[];
  selectedRoute: string | null;
  editingRoute: string | null;
  onSelectRoute: (routeId: string | null) => void;
  onAddRoute: (number: string, color: string, lineWidth: number, lineStyle: 'solid' | 'dashed') => void;
  onDeleteRoute: (routeId: string) => void;
  onUpdateRoute: (routeId: string, updates: Partial<Route>) => void;
  onAddStopToRoute: (routeId: string, stopId: string) => void;
  onRemoveStopFromRoute: (routeId: string, stopId: string) => void;
  onStartEditingPath: (routeId: string) => void;
  onStopEditingPath: () => void;
  onAddPathPoint: (routeId: string) => void;
  onDeletePathPoint: (routeId: string, pointIndex: number) => void;
}

const RouteEditor = ({
  routes,
  stops,
  selectedRoute,
  editingRoute,
  onSelectRoute,
  onAddRoute,
  onDeleteRoute,
  onUpdateRoute,
  onAddStopToRoute,
  onRemoveStopFromRoute,
  onStartEditingPath,
  onStopEditingPath,
  onAddPathPoint,
  onDeletePathPoint,
}: RouteEditorProps) => {
  const [newRouteNumber, setNewRouteNumber] = useState('');
  const [newRouteColor, setNewRouteColor] = useState(COLORS[0]);
  const [newRouteLineWidth, setNewRouteLineWidth] = useState(4);
  const [newRouteLineStyle, setNewRouteLineStyle] = useState<'solid' | 'dashed'>('solid');

  const handleAddRoute = () => {
    if (!newRouteNumber.trim()) {
      toast.error('Введите номер маршрута');
      return;
    }
    onAddRoute(newRouteNumber, newRouteColor, newRouteLineWidth, newRouteLineStyle);
    setNewRouteNumber('');
    toast.success(`Маршрут №${newRouteNumber} добавлен`);
  };

  const selectedRouteData = routes.find(r => r.id === selectedRoute);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Добавление нового маршрута */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Новый маршрут</h3>
          
          <div>
            <Label htmlFor="route-number" className="text-xs">Номер маршрута</Label>
            <Input
              id="route-number"
              value={newRouteNumber}
              onChange={(e) => setNewRouteNumber(e.target.value)}
              placeholder="Например: 5"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Цвет линии</Label>
            <div className="grid grid-cols-5 gap-2 mt-1">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewRouteColor(color)}
                  className={`w-full h-8 rounded border-2 transition-all ${
                    newRouteColor === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Ширина линии</Label>
            <div className="grid grid-cols-6 gap-1 mt-1">
              {LINE_WIDTHS.map((width) => (
                <Button
                  key={width}
                  size="sm"
                  variant={newRouteLineWidth === width ? 'default' : 'outline'}
                  onClick={() => setNewRouteLineWidth(width)}
                  className="text-xs h-8"
                >
                  {width}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs">Стиль линии</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                size="sm"
                variant={newRouteLineStyle === 'solid' ? 'default' : 'outline'}
                onClick={() => setNewRouteLineStyle('solid')}
              >
                Сплошная
              </Button>
              <Button
                size="sm"
                variant={newRouteLineStyle === 'dashed' ? 'default' : 'outline'}
                onClick={() => setNewRouteLineStyle('dashed')}
              >
                Пунктир
              </Button>
            </div>
          </div>

          <Button onClick={handleAddRoute} className="w-full">
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить маршрут
          </Button>
        </Card>

        {/* Список маршрутов */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Маршруты ({routes.length})</Label>
          {routes.map((route) => (
            <Card
              key={route.id}
              className={`p-3 cursor-pointer transition-all ${
                selectedRoute === route.id ? 'ring-2 ring-gray-900' : 'hover:shadow-md'
              }`}
              onClick={() => onSelectRoute(route.id === selectedRoute ? null : route.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border-2 border-white shadow"
                    style={{ backgroundColor: route.color }}
                  />
                  <div>
                    <div className="font-semibold">№{route.number}</div>
                    <div className="text-xs text-gray-500">
                      {route.stops.length} остановок
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRoute(route.id);
                  }}
                >
                  <Icon name="Trash2" size={14} className="text-red-500" />
                </Button>
              </div>

              {selectedRoute === route.id && (
                <div className="mt-3 space-y-2 pt-3 border-t">
                  {/* Редактор пути */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Линия маршрута</Label>
                    {editingRoute === route.id ? (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">
                          Перетаскивайте оранжевые точки или добавьте новые
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onAddPathPoint(route.id)}
                            className="flex-1"
                          >
                            <Icon name="Plus" size={14} className="mr-1" />
                            Точка
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={onStopEditingPath}
                            className="flex-1"
                          >
                            Готово
                          </Button>
                        </div>
                        {route.path.length > 0 && (
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {route.path.map((_, index) => (
                              <div key={index} className="flex items-center justify-between text-xs bg-gray-50 rounded p-1">
                                <span>Точка {index + 1}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 px-1"
                                  onClick={() => onDeletePathPoint(route.id, index)}
                                >
                                  <Icon name="X" size={12} className="text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStartEditingPath(route.id)}
                        className="w-full"
                      >
                        <Icon name="Edit" size={14} className="mr-2" />
                        Редактировать линию ({route.path.length} точек)
                      </Button>
                    )}
                  </div>

                  {/* Остановки маршрута */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Остановки маршрута</Label>
                    {route.stops.length === 0 ? (
                      <p className="text-xs text-gray-500">Нет остановок</p>
                    ) : (
                      <div className="space-y-1">
                        {route.stops.map((stopId) => {
                          const stop = stops.find(s => s.id === stopId);
                          if (!stop) return null;
                          return (
                            <div
                              key={stopId}
                              className="flex items-center justify-between text-xs bg-gray-50 rounded p-2"
                            >
                              <span>{stop.id} {stop.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 px-1"
                                onClick={() => onRemoveStopFromRoute(route.id, stopId)}
                              >
                                <Icon name="X" size={12} className="text-red-500" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Параметры линии */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Параметры</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-600">Ширина</Label>
                        <div className="flex gap-1 mt-1">
                          {LINE_WIDTHS.slice(0, 3).map((width) => (
                            <Button
                              key={width}
                              size="sm"
                              variant={route.lineWidth === width ? 'default' : 'outline'}
                              onClick={() => onUpdateRoute(route.id, { lineWidth: width })}
                              className="text-xs h-6 flex-1"
                            >
                              {width}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Стиль</Label>
                        <div className="flex gap-1 mt-1">
                          <Button
                            size="sm"
                            variant={route.lineStyle === 'solid' ? 'default' : 'outline'}
                            onClick={() => onUpdateRoute(route.id, { lineStyle: 'solid' })}
                            className="text-xs h-6 flex-1"
                          >
                            —
                          </Button>
                          <Button
                            size="sm"
                            variant={route.lineStyle === 'dashed' ? 'default' : 'outline'}
                            onClick={() => onUpdateRoute(route.id, { lineStyle: 'dashed' })}
                            className="text-xs h-6 flex-1"
                          >
                            - -
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default RouteEditor;
