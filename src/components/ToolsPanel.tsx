import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { Stop } from '@/types/transport';

interface ToolsPanelProps {
  tool: 'stop' | 'line' | 'move' | 'connect' | 'delete' | 'edit';
  setTool: (tool: 'stop' | 'line' | 'move' | 'connect' | 'delete' | 'edit') => void;
  newStopName: string;
  setNewStopName: (name: string) => void;
  selectedStops: string[];
  setSelectedStops: (stops: string[]) => void;
  selectedLine: string | null;
  setSelectedLine: (line: string | null) => void;
  stops: Stop[];
  deleteStop: (stopId: string) => void;
  changeLabelPosition: (stopId: string, position: 'top' | 'bottom' | 'left' | 'right') => void;
  selectedStopForLabel: string | null;
  setSelectedStopForLabel: (stopId: string | null) => void;
}

const ToolsPanel = ({
  tool,
  setTool,
  newStopName,
  setNewStopName,
  selectedStops,
  setSelectedStops,
  selectedLine,
  setSelectedLine,
  stops,
  deleteStop,
  changeLabelPosition,
  selectedStopForLabel,
  setSelectedStopForLabel,
}: ToolsPanelProps) => {
  return (
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
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Icon name="MapPin" size={14} className="text-gray-500" />
                      <span className="text-sm font-medium">{stop.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 ml-6">ID: {stop.id}</span>
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
  );
};

export default ToolsPanel;
