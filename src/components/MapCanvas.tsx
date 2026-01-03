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
  onGetMapCenter?: () => { lat: number; lng: number } | null;
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
  onGetMapCenter,
}: MapCanvasProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const segmentEditMarkersRef = useRef<L.CircleMarker[]>([]);
  const [editingSegmentState, setEditingSegmentState] = useState<{
    routeId: string;
    from: string;
    to: string;
    points: { x: number; y: number }[];
  } | null>(null);

  useEffect(() => {
    if (editingSegment) {
      const route = routes.find(r => r.id === editingSegment.routeId);
      if (route) {
        const segment = route.segments.find(
          s => s.from === editingSegment.from && s.to === editingSegment.to
        );
        if (segment) {
          setEditingSegmentState({
            routeId: editingSegment.routeId,
            from: editingSegment.from,
            to: editingSegment.to,
            points: segment.points,
          });
        }
      }
    } else {
      setEditingSegmentState(null);
    }
  }, [editingSegment, routes]);

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

    if (onGetMapCenter) {
      (window as any).__getMapCenter = () => {
        const center = map.getCenter();
        return { lat: center.lat, lng: center.lng };
      };
    }

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
      
      const size = stop.isTerminal ? 16 : 8;
      
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${isSelected ? '#3B82F6' : '#EF4444'};
          border: 1px solid ${isSelected ? '#2563EB' : '#DC2626'};
          border-radius: 50%;
          margin-left: -${size/2}px;
          margin-top: -${size/2}px;
        "></div>`,
        iconSize: [size, size],
      });
      
      const marker = L.marker([stop.y, stop.x], { icon });
      
      let isDragging = false;
      let dragStartPos: L.LatLng | null = null;

      marker.on('mousedown', (e: L.LeafletMouseEvent) => {
        if (e.originalEvent.button !== 0) return;
        isDragging = true;
        dragStartPos = e.latlng;
        map.dragging.disable();
        L.DomEvent.stopPropagation(e);
      });

      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (!isDragging || !dragStartPos) return;
        marker.setLatLng(e.latlng);
      });

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        map.dragging.enable();
        
        const pos = marker.getLatLng();
        const oldStop = stops.find(s => s.id === stop.id);
        if (oldStop) {
          const dx = pos.lng - oldStop.x;
          const dy = pos.lat - oldStop.y;
          const stopsToMove = selectedStops.includes(stop.id) ? selectedStops : [stop.id];
          onStopMove(stopsToMove, dx, dy);
        }
        dragStartPos = null;
      };

      map.on('mouseup', handleMouseUp);

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        onStopSelect(stop.id, e.originalEvent.ctrlKey || e.originalEvent.metaKey);
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
    segmentEditMarkersRef.current.forEach(m => m.remove());
    segmentEditMarkersRef.current = [];

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    segmentEditMarkersRef.current.forEach(m => m.remove());
    segmentEditMarkersRef.current = [];

    if (!editingSegmentState) return;

    editingSegmentState.points.forEach((point, index) => {
      const marker = L.circleMarker([point.y, point.x], {
        radius: 6,
        fillColor: '#F97316',
        color: '#FFFFFF',
        weight: 2,
        fillOpacity: 1,
      });

      let isDragging = false;

      marker.on('mousedown', (e: L.LeafletMouseEvent) => {
        isDragging = true;
        map.dragging.disable();
        L.DomEvent.stopPropagation(e);
      });

      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        if (!isDragging) return;
        marker.setLatLng(e.latlng);
        
        const newPoints = [...editingSegmentState.points];
        newPoints[index] = { x: e.latlng.lng, y: e.latlng.lat };
        setEditingSegmentState({ ...editingSegmentState, points: newPoints });
      });

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        map.dragging.enable();
        
        const pos = marker.getLatLng();
        if (editingSegmentState) {
          onSegmentPointMove(
            editingSegmentState.routeId,
            editingSegmentState.from,
            editingSegmentState.to,
            index,
            pos.lng,
            pos.lat
          );
        }
      };

      map.on('mouseup', handleMouseUp);

      marker.on('contextmenu', () => {
        if (editingSegmentState.points.length > 2) {
          const newPoints = editingSegmentState.points.filter((_, i) => i !== index);
          setEditingSegmentState({ ...editingSegmentState, points: newPoints });
        }
      });

      marker.addTo(map);
      segmentEditMarkersRef.current.push(marker);
    });
  }, [editingSegmentState]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapCanvas;