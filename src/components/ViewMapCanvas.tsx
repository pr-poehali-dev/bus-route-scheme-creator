import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Stop, Route } from '@/types/transport';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ViewMapCanvasProps {
  stops: Stop[];
  routes: Route[];
  selectedRouteId: string | null;
}

const ViewMapCanvas = ({ stops, routes, selectedRouteId }: ViewMapCanvasProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [48.5741, 39.3078],
      zoom: 12,
      zoomControl: true,
      maxBounds: L.latLngBounds([48.35, 39.05], [48.80, 39.60]),
      maxBoundsViscosity: 0.8,
      minZoom: 11,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    map.on('click', () => setSelectedStop(null));

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    stops.forEach((stop) => {
      if (!stop.x || !stop.y) return;

      const radius = stop.isTerminal ? 8 : 4;
      
      const marker = L.circleMarker([stop.y, stop.x], {
        radius,
        fillColor: '#EF4444',
        color: '#DC2626',
        weight: 1,
        fillOpacity: 1,
      });

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setSelectedStop(stop);
      });

      marker.addTo(map);
      markersRef.current.set(stop.id, marker);
    });
  }, [stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    polylinesRef.current.forEach(line => line.remove());
    polylinesRef.current.clear();

    const selectedRoute = selectedRouteId ? routes.find(r => r.id === selectedRouteId) : null;
    
    if (selectedRoute) {
      selectedRoute.segments.forEach((segment) => {
        if (segment.points.length < 2) return;

        const latlngs = segment.points.map(p => L.latLng(p.y, p.x));
        const polyline = L.polyline(latlngs, {
          color: selectedRoute.color,
          weight: selectedRoute.lineWidth,
          opacity: 0.9,
        });

        polyline.addTo(map);
        polylinesRef.current.set(`${selectedRoute.id}-${segment.from}-${segment.to}`, polyline);
      });
    }
  }, [routes, selectedRouteId]);

  const getStopRoutes = (stopId: string) => {
    return routes.filter(r => r.stops.includes(stopId));
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {selectedStop && (
        <Card className="absolute top-4 left-4 p-4 shadow-lg max-w-sm bg-white z-[1000]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-pink-600 text-2xl font-bold">{selectedStop.id}</div>
              <div className="text-2xl font-bold mt-1">{selectedStop.name}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedStop(null)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          <div className="text-sm text-gray-500 mb-3">
            {getStopRoutes(selectedStop.id).length} SERVICE
            {selectedStop.isTerminal && ' • КОНЕЧНАЯ'}
          </div>

          <div className="flex flex-wrap gap-2">
            {getStopRoutes(selectedStop.id).map(route => (
              <Badge
                key={route.id}
                className="text-base px-4 py-2"
                style={{ backgroundColor: route.color, color: 'white' }}
              >
                {route.number}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ViewMapCanvas;
