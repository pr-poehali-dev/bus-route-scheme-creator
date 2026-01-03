import { useEffect, useRef, useState } from 'react';
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
  editingSegment,
  mode,
  onStopSelect,
  onStopMove,
  onSegmentPointMove,
  onCanvasClick,
}: MapCanvasProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStops, setDraggedStops] = useState<string[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const luganskCenter = L.latLng(48.5741, 39.3078);
    const map = L.map(containerRef.current, {
      center: luganskCenter,
      zoom: 12,
      zoomControl: true,
      maxBounds: L.latLngBounds(
        L.latLng(48.35, 39.05),
        L.latLng(48.80, 39.60)
      ),
      maxBoundsViscosity: 0.8,
      minZoom: 11,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    map.on('click', (e) => {
      if (mode === 'add-stop') {
        const { lat, lng } = e.latlng;
        onCanvasClick(lng, lat);
      } else {
        onStopSelect(null, false);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    stops.forEach((stop) => {
      if (!stop.x || !stop.y) return;
      
      const isSelected = selectedStops.includes(stop.id);
      const latlng = L.latLng(stop.y, stop.x);

      const marker = L.circleMarker(latlng, {
        radius: stop.isTerminal ? 10 : 7,
        fillColor: '#FFFFFF',
        color: isSelected ? '#3B82F6' : '#1F2937',
        weight: isSelected ? 4 : 3,
        fillOpacity: 1,
      });

      marker.bindTooltip(stop.name, {
        permanent: true,
        direction: 'top',
        className: 'stop-label',
        offset: [0, -10],
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onStopSelect(stop.id, e.originalEvent.ctrlKey || e.originalEvent.metaKey);
      });

      marker.on('mousedown', () => {
        const stopsToMove = selectedStops.includes(stop.id) ? selectedStops : [stop.id];
        setIsDragging(true);
        setDraggedStops(stopsToMove);
      });

      marker.addTo(mapRef.current!);
      markersRef.current.set(stop.id, marker);
    });
  }, [stops, selectedStops]);

  useEffect(() => {
    if (!mapRef.current) return;

    polylinesRef.current.forEach((line) => line.remove());
    polylinesRef.current.clear();

    routes.forEach((route) => {
      route.segments.forEach((segment) => {
        if (segment.points.length < 2) return;

        const latlngs = segment.points.map((p) => L.latLng(p.y, p.x));
        const polyline = L.polyline(latlngs, {
          color: route.color,
          weight: route.lineWidth,
          opacity: 0.8,
        });

        polyline.addTo(mapRef.current!);
        polylinesRef.current.set(`${route.id}-${segment.from}-${segment.to}`, polyline);
      });
    });
  }, [routes]);

  useEffect(() => {
    if (!mapRef.current || !isDragging || draggedStops.length === 0) return;

    const map = mapRef.current;
    let lastLatlng: L.LatLng | null = null;

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (!lastLatlng) {
        lastLatlng = e.latlng;
        return;
      }

      const dlat = e.latlng.lat - lastLatlng.lat;
      const dlng = e.latlng.lng - lastLatlng.lng;

      onStopMove(draggedStops, dlng, dlat);
      lastLatlng = e.latlng;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggedStops([]);
      lastLatlng = null;
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseup', handleMouseUp);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedStops]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <style>{`
        .stop-label {
          background: transparent;
          border: none;
          box-shadow: none;
          font-size: 13px;
          font-weight: 500;
          color: #1F2937;
          white-space: nowrap;
        }
        .leaflet-tooltip-top:before,
        .leaflet-tooltip-bottom:before,
        .leaflet-tooltip-left:before,
        .leaflet-tooltip-right:before {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MapCanvas;