import { useRef, useEffect } from 'react';
import { Stop, Line } from '@/types/transport';

interface TransportCanvasProps {
  stops: Stop[];
  lines: Line[];
  currentLine: { x: number; y: number }[];
  selectedStops: string[];
  selectedColor: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed';
  selectedLine: string | null;
  tool: 'stop' | 'line' | 'move' | 'connect' | 'delete' | 'edit';
  onCanvasClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onCanvasMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onCanvasMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onCanvasMouseUp: () => void;
}

const TransportCanvas = ({
  stops,
  lines,
  currentLine,
  selectedStops,
  selectedColor,
  lineWidth,
  lineStyle,
  selectedLine,
  tool,
  onCanvasClick,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
}: TransportCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawCanvas();
  }, [stops, lines, currentLine, selectedStops, lineWidth, lineStyle, selectedLine]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 40;
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    lines.forEach((line) => {
      if (line.points.length > 1) {
        const offset = line.offset || 0;
        const isSelected = selectedLine === line.id;
        
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (line.lineStyle === 'dashed') {
          ctx.setLineDash([10, 5]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.beginPath();
        if (offset === 0) {
          ctx.moveTo(line.points[0].x, line.points[0].y);
          for (let i = 1; i < line.points.length; i++) {
            ctx.lineTo(line.points[i].x, line.points[i].y);
          }
        } else {
          const offsetPoints = line.points.map((p, i) => {
            if (i === 0 || i === line.points.length - 1) return p;
            const prev = line.points[i - 1];
            const next = line.points[i + 1];
            const dx1 = p.x - prev.x;
            const dy1 = p.y - prev.y;
            const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const dx2 = next.x - p.x;
            const dy2 = next.y - p.y;
            const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            const perpX = -(dy1 / len1 + dy2 / len2) / 2;
            const perpY = (dx1 / len1 + dx2 / len2) / 2;
            return { x: p.x + perpX * offset, y: p.y + perpY * offset };
          });
          ctx.moveTo(offsetPoints[0].x, offsetPoints[0].y);
          for (let i = 1; i < offsetPoints.length; i++) {
            ctx.lineTo(offsetPoints[i].x, offsetPoints[i].y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
        
        if (isSelected && tool === 'edit') {
          line.points.forEach((point) => {
            ctx.fillStyle = '#F97316';
            ctx.fillRect(point.x - 4, point.y - 4, 8, 8);
          });
        }
      }
    });

    if (currentLine.length > 1) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (lineStyle === 'dashed') {
        ctx.setLineDash([10, 5]);
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.beginPath();
      ctx.moveTo(currentLine[0].x, currentLine[0].y);
      for (let i = 1; i < currentLine.length; i++) {
        ctx.lineTo(currentLine[i].x, currentLine[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    stops.forEach((stop) => {
      const isSelected = selectedStops.includes(stop.id);
      
      ctx.fillStyle = isSelected ? selectedColor : '#FFFFFF';
      ctx.strokeStyle = '#1A1F2C';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(stop.x, stop.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1A1F2C';
      ctx.font = '12px Roboto';
      
      let textX = stop.x;
      let textY = stop.y - 15;
      ctx.textAlign = 'center';
      
      switch (stop.labelPosition) {
        case 'top':
          textY = stop.y - 15;
          ctx.textAlign = 'center';
          break;
        case 'bottom':
          textY = stop.y + 25;
          ctx.textAlign = 'center';
          break;
        case 'left':
          textX = stop.x - 15;
          textY = stop.y + 4;
          ctx.textAlign = 'right';
          break;
        case 'right':
          textX = stop.x + 15;
          textY = stop.y + 4;
          ctx.textAlign = 'left';
          break;
      }
      
      ctx.fillText(stop.name, textX, textY);
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <canvas
        ref={canvasRef}
        width={1600}
        height={1000}
        onClick={onCanvasClick}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        className="bg-white rounded-lg shadow-lg cursor-crosshair"
      />
    </div>
  );
};

export default TransportCanvas;
