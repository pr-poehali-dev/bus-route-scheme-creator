import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';

interface SettingsPanelProps {
  importFromJSON: () => void;
  exportToJSON: () => void;
  exportToPNG: () => void;
}

const SettingsPanel = ({
  importFromJSON,
  exportToJSON,
  exportToPNG,
}: SettingsPanelProps) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">Импорт/Экспорт</Label>
          <div className="space-y-2">
            <Button onClick={importFromJSON} className="w-full" variant="outline">
              <Icon name="Upload" size={16} className="mr-2" />
              Импорт из JSON
            </Button>
            <Button onClick={exportToJSON} className="w-full" variant="outline">
              <Icon name="FileJson" size={16} className="mr-2" />
              Экспорт в JSON
            </Button>
            <Button onClick={exportToPNG} className="w-full" variant="default">
              <Icon name="Download" size={16} className="mr-2" />
              Экспорт в PNG
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default SettingsPanel;
