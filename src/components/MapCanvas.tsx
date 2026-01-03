import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Stop, Route } from '@/types/transport';

interface MapCanvasProps {
  stops: Stop[];
  routes: Route[];
  selectedStops: string[];
  editingSegment: { routeId: string; from: string; to: string } | null;
  mode: 'select' | 'add-stop';
  onStopSelect: (stopId: string | null, ctrlKey: boolean) => void;
  onStopMove: (stopIds: string[], dx: number, dy: number) => void;
  onSegmentPointMove: (routeId: string, from: string, to: string, pointIndex: number, x: number, y: number) => void;
  onCanvasClick: (x: number, y: number) => void;
}

const MapCanvas = ({
  stops,
  routes,
  selectedStops,
  mode,
  onStopSelect,
  onStopMove,
  onCanvasClick,
}: MapCanvasProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [48.5741, 39.3078],
      zoom: 12,
      zoomControl: true,
      maxBounds: L.latLngBounds(
        [48.35, 39.05],
        [48.80, 39.60]
      ),
      maxBoundsViscosity: 0.8,
      minZoom: 11,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (mode === 'add-stop') {
        onCanvasClick(e.latlng.lng, e.latlng.lat);
      } else {
        onStopSelect(null, false);
      }
    });

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

      const isSelected = selectedStops.includes(stop.id);
      
      const radius = stop.isTerminal ? 8 : 4;
      
      const marker = L.circleMarker([stop.y, stop.x], {
        radius,
        fillColor: isSelected ? '#3B82F6' : '#EF4444',
        color: isSelected ? '#2563EB' : '#DC2626',
        weight: 1,
        fillOpacity: 1,
        draggable: true,
      }) as L.CircleMarker & { dragging?: { enable: () => void } };
      
      marker.dragging?.enable();

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onStopSelect(stop.id, e.originalEvent.ctrlKey || e.originalEvent.metaKey);
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        const oldStop = stops.find(s => s.id === stop.id);
        if (oldStop) {
          const dx = pos.lng - oldStop.x;
          const dy = pos.lat - oldStop.y;
          const stopsToMove = selectedStops.includes(stop.id) ? selectedStops : [stop.id];
          onStopMove(stopsToMove, dx, dy);
        }
      });

      marker.addTo(map);
      markersRef.current.set(stop.id, marker);
    });
  }, [stops, selectedStops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    polylinesRef.current.forEach(line => line.remove());
    polylinesRef.current.clear();

    routes.forEach((route) => {
      route.segments.forEach((segment) => {
        if (segment.points.length < 2) return;

        const latlngs = segment.points.map(p => L.latLng(p.y, p.x));
        const polyline = L.polyline(latlngs, {
          color: route.color,
          weight: route.lineWidth,
          opacity: 0.7,
        });

        polyline.addTo(map);
        polylinesRef.current.set(`${route.id}-${segment.from}-${segment.to}`, polyline);
      });
    });
  }, [routes]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapCanvas;