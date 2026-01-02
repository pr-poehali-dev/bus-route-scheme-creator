import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { Stop, Route } from '@/types/transport';
import { toast } from 'sonner';

interface StopEditorProps {
  stops: Stop[];
  routes: Route[];
  selectedStops: string[];
  selectedRoute: string | null;
  alignMode: 'horizontal' | 'vertical' | null;
  onAddStop: (name: string) => void;
  onDeleteStop: (stopId: string) => void;
  onUpdateStop: (stopId: string, updates: Partial<Stop>) => void;
  onSelectStop: (stopId: string, multiSelect: boolean) => void;
  onClearSelection: () => void;
  onAddStopToRoute: (routeId: string, stopId: string) => void;
  onRemoveStopFromRoute: (routeId: string, stopId: string) => void;
  onSetAlignMode: (mode: 'horizontal' | 'vertical' | null) => void;
  onAlignStops: () => void;
}

const StopEditor = ({
  stops,
  routes,
  selectedStops,
  selectedRoute,
  alignMode,
  onAddStop,
  onDeleteStop,
  onUpdateStop,
  onSelectStop,
  onClearSelection,
  onAddStopToRoute,
  onRemoveStopFromRoute,
  onSetAlignMode,
  onAlignStops,
}: StopEditorProps) => {
  const [newStopName, setNewStopName] = useState('');
  const [expandedStop, setExpandedStop] = useState<string | null>(null);

  const handleAddStop = () => {
    if (!newStopName.trim()) {
      toast.error('Введите название остановки');
      return;
    }
    onAddStop(newStopName);
    setNewStopName('');
    toast.success(`Остановка "${newStopName}" добавлена`);
  };

  const getNextStopId = () => {
    const maxId = stops.reduce((max, stop) => {
      const num = parseInt(stop.id);
      return num > max ? num : max;
    }, 0);
    return String(maxId + 1).padStart(3, '0');
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Добавление новой остановки */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-sm">Новая остановка</h3>
          
          <div>
            <Label htmlFor="stop-name" className="text-xs">Название остановки</Label>
            <Input
              id="stop-name"
              value={newStopName}
              onChange={(e) => setNewStopName(e.target.value)}
              placeholder="Например: Центральная"
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddStop();
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Следующий ID:</span>
            <span className="font-mono font-semibold">{getNextStopId()}</span>
          </div>

          <Button onClick={handleAddStop} className="w-full">
            <Icon name="Plus" size={16} className="mr-2" />
            Добавить остановку
          </Button>
        </Card>

        {/* Инструменты выравнивания */}
        {selectedStops.length > 1 && (
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Выравнивание ({selectedStops.length} выбрано)</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={alignMode === 'horizontal' ? 'default' : 'outline'}
                onClick={() => onSetAlignMode(alignMode === 'horizontal' ? null : 'horizontal')}
              >
                <Icon name="AlignHorizontalJustifyCenter" size={14} className="mr-1" />
                По горизонтали
              </Button>
              <Button
                size="sm"
                variant={alignMode === 'vertical' ? 'default' : 'outline'}
                onClick={() => onSetAlignMode(alignMode === 'vertical' ? null : 'vertical')}
              >
                <Icon name="AlignVerticalJustifyCenter" size={14} className="mr-1" />
                По вертикали
              </Button>
            </div>

            {alignMode && (
              <Button size="sm" onClick={onAlignStops} className="w-full" variant="secondary">
                <Icon name="Check" size={14} className="mr-1" />
                Применить выравнивание
              </Button>
            )}

            <Button size="sm" variant="outline" onClick={onClearSelection} className="w-full">
              <Icon name="X" size={14} className="mr-1" />
              Снять выделение
            </Button>
          </Card>
        )}

        {/* Список остановок */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Остановки ({stops.length})</Label>
          {stops.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">
              Остановок пока нет.<br />Добавьте первую остановку выше.
            </p>
          ) : (
            stops.map((stop) => {
              const isExpanded = expandedStop === stop.id;
              const isSelected = selectedStops.includes(stop.id);
              
              return (
                <Card
                  key={stop.id}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => setExpandedStop(isExpanded ? null : stop.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          onSelectStop(stop.id, true);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2">
                          <span className="font-mono">{stop.id}</span>
                          <span>{stop.name}</span>
                          {stop.isTerminal && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                              Конечная
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {stop.routes.length} маршрутов
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedStop(isExpanded ? null : stop.id);
                        }}
                      >
                        <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={14} />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-3 pt-3 border-t">
                      {/* Конечная остановка */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Конечная остановка</Label>
                        <Checkbox
                          checked={stop.isTerminal}
                          onCheckedChange={(checked) => {
                            onUpdateStop(stop.id, { isTerminal: checked as boolean });
                          }}
                        />
                      </div>

                      {/* Позиция названия */}
                      <div>
                        <Label className="text-xs mb-2 block">Позиция названия</Label>
                        <div className="grid grid-cols-4 gap-1">
                          <Button
                            size="sm"
                            variant={stop.labelPosition === 'top' ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStop(stop.id, { labelPosition: 'top' });
                            }}
                            className="h-8"
                          >
                            <Icon name="ArrowUp" size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant={stop.labelPosition === 'bottom' ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStop(stop.id, { labelPosition: 'bottom' });
                            }}
                            className="h-8"
                          >
                            <Icon name="ArrowDown" size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant={stop.labelPosition === 'left' ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStop(stop.id, { labelPosition: 'left' });
                            }}
                            className="h-8"
                          >
                            <Icon name="ArrowLeft" size={12} />
                          </Button>
                          <Button
                            size="sm"
                            variant={stop.labelPosition === 'right' ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStop(stop.id, { labelPosition: 'right' });
                            }}
                            className="h-8"
                          >
                            <Icon name="ArrowRight" size={12} />
                          </Button>
                        </div>
                      </div>

                      {/* Маршруты */}
                      <div>
                        <Label className="text-xs mb-2 block">Маршруты остановки</Label>
                        {stop.routes.length === 0 ? (
                          <p className="text-xs text-gray-500">Не привязана к маршрутам</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {stop.routes.map((routeId) => {
                              const route = routes.find(r => r.id === routeId);
                              if (!route) return null;
                              return (
                                <div
                                  key={routeId}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded border"
                                  style={{
                                    borderColor: route.color,
                                    backgroundColor: `${route.color}15`,
                                  }}
                                >
                                  <span>№{route.number}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveStopFromRoute(routeId, stop.id);
                                    }}
                                    className="hover:text-red-500"
                                  >
                                    <Icon name="X" size={10} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {selectedRoute && !stop.routes.includes(selectedRoute) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddStopToRoute(selectedRoute, stop.id);
                            }}
                            className="w-full mt-2"
                          >
                            <Icon name="Plus" size={12} className="mr-1" />
                            Добавить в маршрут №{routes.find(r => r.id === selectedRoute)?.number}
                          </Button>
                        )}
                      </div>

                      {/* Удалить остановку */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStop(stop.id);
                        }}
                        className="w-full"
                      >
                        <Icon name="Trash2" size={12} className="mr-1" />
                        Удалить остановку
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default StopEditor;
