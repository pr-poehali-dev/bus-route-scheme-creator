import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { Route, Stop } from '@/types/transport';

interface RoutesPanelProps {
  routes: Route[];
  stops: Stop[];
  newRouteNumber: string;
  setNewRouteNumber: (number: string) => void;
  selectedRoute: string | null;
  setSelectedRoute: (routeId: string | null) => void;
  addRoute: () => void;
  deleteRoute: (routeId: string) => void;
  addStopToRoute: (routeId: string, stopId: string) => void;
}

const RoutesPanel = ({
  routes,
  stops,
  newRouteNumber,
  setNewRouteNumber,
  selectedRoute,
  setSelectedRoute,
  addRoute,
  deleteRoute,
  addStopToRoute,
}: RoutesPanelProps) => {
  return (
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
  );
};

export default RoutesPanel;
