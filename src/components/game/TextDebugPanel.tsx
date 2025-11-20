import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface TextDebugPanelProps {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  yOffset: number;
  onRotationXChange: (value: number) => void;
  onRotationYChange: (value: number) => void;
  onRotationZChange: (value: number) => void;
  onYOffsetChange: (value: number) => void;
}

export const TextDebugPanel = ({
  rotationX,
  rotationY,
  rotationZ,
  yOffset,
  onRotationXChange,
  onRotationYChange,
  onRotationZChange,
  onYOffsetChange,
}: TextDebugPanelProps) => {
  return (
    <Card className="fixed top-4 right-4 p-4 w-80 bg-background/95 backdrop-blur z-50 space-y-4">
      <h3 className="font-bold text-lg mb-4">Debug: Rotace textu</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Rotace X: {rotationX.toFixed(2)}°</Label>
        </div>
        <Slider
          value={[rotationX]}
          onValueChange={([value]) => onRotationXChange(value)}
          min={-180}
          max={180}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Rotace Y (radiální): {rotationY.toFixed(2)}°</Label>
        </div>
        <Slider
          value={[rotationY]}
          onValueChange={([value]) => onRotationYChange(value)}
          min={-180}
          max={180}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Rotace Z: {rotationZ.toFixed(2)}°</Label>
        </div>
        <Slider
          value={[rotationZ]}
          onValueChange={([value]) => onRotationZChange(value)}
          min={-180}
          max={180}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Y Offset: {yOffset.toFixed(3)}</Label>
        </div>
        <Slider
          value={[yOffset * 100]}
          onValueChange={([value]) => onYOffsetChange(value / 100)}
          min={-10}
          max={10}
          step={0.1}
        />
      </div>

      <div className="text-xs text-muted-foreground mt-4 space-y-1">
        <p>• Rotace X: Sklápění (konstantní pro všechny)</p>
        <p className="text-yellow-400 font-bold">• Rotace Y: OFFSET přičítaný k midAngle každého segmentu</p>
        <p>• Rotace Z: Otáčení v rovině (konstantní)</p>
        <p>• Y Offset: Výška nad povrchem segmentu</p>
      </div>

      <div className="text-xs bg-yellow-500/20 border border-yellow-500/50 p-2 rounded mt-2">
        <p className="font-bold text-yellow-400 mb-1">Pro každý segment:</p>
        <p className="font-mono text-xs">
          rotation: [<br/>
          &nbsp;&nbsp;{(rotationX * Math.PI / 180).toFixed(3)},<br/>
          &nbsp;&nbsp;<span className="text-yellow-300">midAngle + {(rotationY * Math.PI / 180).toFixed(3)}</span>,<br/>
          &nbsp;&nbsp;{(rotationZ * Math.PI / 180).toFixed(3)}<br/>
          ]
        </p>
      </div>
    </Card>
  );
};
