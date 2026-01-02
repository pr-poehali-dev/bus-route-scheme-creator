import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Stop, Route, COLORS } from '@/types/transport';
import { toast } from 'sonner';

interface SidebarProps {
  stops: Stop[];
  routes: Route[];
  selectedStop: string | null;
  editingSegment: { routeId: string; from: string; to: string } | null;
  onAddStop: (name: string) => void;
  onUpdateStop: (id: string, updates: Partial<Stop>) => void;
  onDeleteStop: (id: string) => void;
  onAddRoute: (number: string, name: string, color: string, width: number) => void;
  onUpdateRoute: (id: string, updates: Partial<Route>) => void;
  onDeleteRoute: (id: string) => void;
  onAddStopToRoute: (routeId: string, stopId: string) => void;
  onRemoveStopFromRoute: (routeId: string, stopId: string) => void;
  onReorderStops: (routeId: string, stopIds: string[]) => void;
  onEditSegment: (routeId: string, from: string, to: string) => void;
  onStopEditingSegment: () => void;
  onAddSegmentPoint: (routeId: string, from: string, to: string) => void;
  onDeleteSegmentPoint: (routeId: string, from: string, to: string, index: number) => void;
  onAutoRoute: (routeId: string) => void;
  onExport: () => void;
  onImport: () => void;
}

const Sidebar = ({
  stops,
  routes,
  selectedStop,
  editingSegment,
  onAddStop,
  onUpdateStop,
  onDeleteStop,
  onAddRoute,
  onUpdateRoute,
  onDeleteRoute,
  onAddStopToRoute,
  onRemoveStopFromRoute,
  onReorderStops,
  onEditSegment,
  onStopEditingSegment,
  onAddSegmentPoint,
  onDeleteSegmentPoint,
  onAutoRoute,
  onExport,
  onImport,
}: SidebarProps) => {
  const [tab, setTab] = useState<'routes' | 'stops'>('routes');
  const [newStopName, setNewStopName] = useState('');
  const [newRouteNumber, setNewRouteNumber] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteColor, setNewRouteColor] = useState(COLORS[0].value);
  const [newRouteWidth, setNewRouteWidth] = useState(4);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);

  const getNextStopId = () => {
    const max = stops.reduce((m, s) => Math.max(m, parseInt(s.id) || 0), 0);
    return String(max + 1).padStart(3, '0');
  };

  const handleAddStop = () => {
    if (!newStopName.trim()) {
      toast.error('Введите название');
      return;
    }
    onAddStop(newStopName);
    setNewStopName('');
    toast.success('Остановка добавлена');
  };

  const handleAddRoute = () => {
    if (!newRouteNumber.trim()) {
      toast.error('Введите номер');
      return;
    }
    onAddRoute(newRouteNumber, newRouteName, newRouteColor, newRouteWidth);
    setNewRouteNumber('');
    setNewRouteName('');
    toast.success('Маршрут добавлен');
  };

  const selectedStopData = stops.find(s => s.id === selectedStop);

  return (
    <div className="w-96 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Редактор схем</h1>
        <p className="text-sm text-gray-500 mt-1">Транспортные маршруты</p>
      </div>

      <div className="flex border-b">
        <button
          onClick={() => setTab('routes')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === 'routes'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Маршруты
        </button>
        <button
          onClick={() => setTab('stops')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === 'stops'
              ? 'border-b-2 border-gray-900 text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Остановки
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {tab === 'routes' ? (
            <>
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Новый маршрут</h3>
                <div>
                  <Label className="text-xs">Номер</Label>
                  <Input
                    value={newRouteNumber}
                    onChange={e => setNewRouteNumber(e.target.value)}
                    placeholder="5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Название (опционально)</Label>
                  <Input
                    value={newRouteName}
                    onChange={e => setNewRouteName(e.target.value)}
                    placeholder="Центр - Вокзал"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Цвет</Label>
                  <div className="grid grid-cols-5 gap-2 mt-1">
                    {COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setNewRouteColor(c.value)}
                        className={`h-9 rounded border-2 transition ${
                          newRouteColor === c.value
                            ? 'border-gray-900 scale-105'
                            : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Ширина линии</Label>
                  <div className="flex gap-2 mt-1">
                    {[3, 4, 5, 6].map(w => (
                      <Button
                        key={w}
                        size="sm"
                        variant={newRouteWidth === w ? 'default' : 'outline'}
                        onClick={() => setNewRouteWidth(w)}
                        className="flex-1"
                      >
                        {w}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddRoute} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать маршрут
                </Button>
              </Card>

              <Separator />

              <div className="space-y-2">
                {routes.map(route => {
                  const isExpanded = expandedRoute === route.id;
                  return (
                    <Card key={route.id} className="overflow-hidden">
                      <div
                        className="p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedRoute(isExpanded ? null : route.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded border-2 border-white shadow-sm"
                              style={{ backgroundColor: route.color }}
                            />
                            <div>
                              <div className="font-semibold">№{route.number}</div>
                              {route.name && (
                                <div className="text-xs text-gray-500">{route.name}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{route.stops.length}</Badge>
                            <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={16} />
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t p-3 space-y-3">
                          <div>
                            <Label className="text-xs mb-2 block">Остановки</Label>
                            {route.stops.length === 0 ? (
                              <p className="text-xs text-gray-500">Нет остановок</p>
                            ) : (
                              <div className="space-y-1">
                                {route.stops.map((stopId, idx) => {
                                  const stop = stops.find(s => s.id === stopId);
                                  if (!stop) return null;

                                  const nextStopId = route.stops[idx + 1];
                                  const hasSegment = nextStopId !== undefined;
                                  const isEditingThis =
                                    editingSegment?.routeId === route.id &&
                                    editingSegment?.from === stopId &&
                                    editingSegment?.to === nextStopId;

                                  return (
                                    <div key={stopId}>
                                      <div className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                                        <span className="font-medium">
                                          {stop.id} {stop.name}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 px-1"
                                          onClick={() => onRemoveStopFromRoute(route.id, stopId)}
                                        >
                                          <Icon name="X" size={12} />
                                        </Button>
                                      </div>
                                      {hasSegment && (
                                        <div className="ml-4 mt-1 mb-1">
                                          {isEditingThis ? (
                                            <div className="space-y-1">
                                              <div className="flex gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() =>
                                                    onAddSegmentPoint(route.id, stopId, nextStopId)
                                                  }
                                                  className="flex-1 h-7 text-xs"
                                                >
                                                  <Icon name="Plus" size={12} className="mr-1" />
                                                  Точка
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="default"
                                                  onClick={onStopEditingSegment}
                                                  className="flex-1 h-7 text-xs"
                                                >
                                                  Готово
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                onEditSegment(route.id, stopId, nextStopId)
                                              }
                                              className="w-full h-7 text-xs"
                                            >
                                              <Icon name="Edit" size={12} className="mr-1" />
                                              Редактировать линию
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const available = stops.filter(
                                  s => !route.stops.includes(s.id)
                                );
                                if (available.length === 0) {
                                  toast.error('Все остановки уже добавлены');
                                  return;
                                }
                                // Добавляем первую доступную
                                onAddStopToRoute(route.id, available[0].id);
                              }}
                              className="flex-1"
                            >
                              <Icon name="Plus" size={14} className="mr-1" />
                              Остановку
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onAutoRoute(route.id)}
                              className="flex-1"
                            >
                              <Icon name="Zap" size={14} className="mr-1" />
                              Авто-путь
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteRoute(route.id)}
                            className="w-full"
                          >
                            <Icon name="Trash2" size={14} className="mr-1" />
                            Удалить маршрут
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <Card className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Новая остановка</h3>
                <div>
                  <Label className="text-xs">Название</Label>
                  <Input
                    value={newStopName}
                    onChange={e => setNewStopName(e.target.value)}
                    placeholder="Центральная"
                    className="mt-1"
                    onKeyDown={e => e.key === 'Enter' && handleAddStop()}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Следующий ID: <span className="font-mono font-semibold">{getNextStopId()}</span>
                </div>
                <Button onClick={handleAddStop} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Добавить остановку
                </Button>
              </Card>

              {selectedStopData && (
                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm">
                    {selectedStopData.id} {selectedStopData.name}
                  </h3>
                  <div>
                    <Label className="text-xs mb-2 block">Позиция названия</Label>
                    <div className="grid grid-cols-4 gap-1">
                      {(['top', 'bottom', 'left', 'right'] as const).map(pos => (
                        <Button
                          key={pos}
                          size="sm"
                          variant={selectedStopData.labelPosition === pos ? 'default' : 'outline'}
                          onClick={() =>
                            onUpdateStop(selectedStopData.id, { labelPosition: pos })
                          }
                        >
                          <Icon
                            name={
                              pos === 'top'
                                ? 'ArrowUp'
                                : pos === 'bottom'
                                ? 'ArrowDown'
                                : pos === 'left'
                                ? 'ArrowLeft'
                                : 'ArrowRight'
                            }
                            size={14}
                          />
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Конечная</Label>
                    <input
                      type="checkbox"
                      checked={selectedStopData.isTerminal}
                      onChange={e =>
                        onUpdateStop(selectedStopData.id, { isTerminal: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteStop(selectedStopData.id)}
                    className="w-full"
                  >
                    <Icon name="Trash2" size={14} className="mr-1" />
                    Удалить остановку
                  </Button>
                </Card>
              )}

              <Separator />

              <div className="space-y-2">
                {stops.map(stop => (
                  <Card
                    key={stop.id}
                    className={`p-3 cursor-pointer transition ${
                      selectedStop === stop.id ? 'ring-2 ring-blue-500' : 'hover:shadow'
                    }`}
                    onClick={() => {}}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {stop.id} {stop.name}
                        </div>
                        {stop.isTerminal && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            Конечная
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <Button onClick={onImport} variant="outline" size="sm" className="w-full">
          <Icon name="Upload" size={14} className="mr-2" />
          Импорт JSON
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onExport} variant="outline" size="sm">
            <Icon name="Download" size={14} className="mr-1" />
            Экспорт
          </Button>
          <Button
            onClick={() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                canvas.toBlob(blob => {
                  if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'scheme.png';
                    a.click();
                  }
                });
              }
            }}
            variant="outline"
            size="sm"
          >
            <Icon name="Image" size={14} className="mr-1" />
            PNG
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
