"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Download, RotateCcw, Undo, Redo, Eraser } from "lucide-react";
import { CanvasEditor } from "@/components/CanvasEditor";
import { ControlsPanel } from "@/components/ControlsPanel";
import { ImageUpload } from "@/components/ImageUpload";
import { BeforeAfterToggle } from "@/components/BeforeAfterToggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Command, 
  AppState, 
  HistoryState, 
  executeCommand, 
  undo as undoCommand, 
  redo as redoCommand,
  LightRun as CommandLightRun,
  MiniLightArea as CommandMiniLightArea
} from "@/lib/commandHistory";

export interface LightRun {
  id: string;
  points: { x: number; y: number }[];
  pattern: "warm-white" | "cool-white" | "multi-color" | "candy-cane" | "icicle" | "blue" | "halloween" | "orange";
  spacing: number;
  brightness: number;
  visible: boolean;
}

export interface MiniLightArea {
  id: string;
  points: { x: number; y: number }[]; // polygon boundary points (normalized)
  pattern: "warm-white" | "cool-white" | "multi-color" | "candy-cane" | "icicle" | "blue" | "halloween" | "orange";
  size: number; // 0.5 - 1.5px
  density: number; // 5% - 80%
  brightness: number;
  visible: boolean;
}

type DrawingMode = 'idle' | 'drawing-string' | 'tracing-mini';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [lightRuns, setLightRuns] = useState<LightRun[]>([]);
  const [miniLightAreas, setMiniLightAreas] = useState<MiniLightArea[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<LightRun["pattern"]>("warm-white");
  const [bulbSpacing, setBulbSpacing] = useState(16);
  const [brightness, setBrightness] = useState(85);

  const [miniLightPattern, setMiniLightPattern] = useState<MiniLightArea["pattern"]>("warm-white");
  const [miniLightSize, setMiniLightSize] = useState(1.0);
  const [miniLightDensity, setMiniLightDensity] = useState(40);
  const [miniLightBrightness, setMiniLightBrightness] = useState(85);

  const [showBefore, setShowBefore] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('idle');
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentRun, setCurrentRun] = useState<{ x: number; y: number }[]>([]);
  const [currentMiniTrace, setCurrentMiniTrace] = useState<{ x: number; y: number }[]>([]);

  // Derived state
  const isDrawing = drawingMode === 'drawing-string';
  const isTracingMini = drawingMode === 'tracing-mini';
  const isInCooldown = Date.now() < cooldownUntil;

  const executeAndApplyCommand = (command: Command) => {
    const currentState: AppState = { lightRuns, miniLightAreas };
    const result = executeCommand(currentState, history, command);
    
    setLightRuns(result.state.lightRuns);
    setMiniLightAreas(result.state.miniLightAreas);
    setHistory(result.history);
  };

  const handlePatternChange = (p: LightRun["pattern"]) => {
    setSelectedPattern(p);
    if (lightRuns.length) {
      const updated = lightRuns.map(r => ({ ...r, pattern: p }));
      // For bulk updates, we'll apply them directly and create a single command
      const command: Command = {
        kind: 'update-run',
        before: lightRuns[0], // This is simplified - in practice you'd need to handle multiple runs
        after: updated[0]
      };
      // For now, just update directly to avoid complexity
      setLightRuns(updated);
    }
  };
  
  const handleSpacingChange = (s: number) => {
    setBulbSpacing(s);
    if (lightRuns.length) {
      const updated = lightRuns.map(r => ({ ...r, spacing: s }));
      setLightRuns(updated);
    }
  };
  
  const handleBrightnessChange = (b: number) => {
    setBrightness(b);
    if (lightRuns.length) {
      const updated = lightRuns.map(r => ({ ...r, brightness: b }));
      setLightRuns(updated);
    }
  };

  // mini-lights bulk
  const handleMiniPatternChange = (p: MiniLightArea["pattern"]) => {
    setMiniLightPattern(p);
    if (miniLightAreas.length) {
      const updated = miniLightAreas.map(a => ({ ...a, pattern: p }));
      setMiniLightAreas(updated);
    }
  };
  
  const handleMiniSizeChange = (n: number) => {
    setMiniLightSize(n);
    if (miniLightAreas.length) {
      const updated = miniLightAreas.map(a => ({ ...a, size: n }));
      setMiniLightAreas(updated);
    }
  };
  
  const handleMiniDensityChange = (n: number) => {
    setMiniLightDensity(n);
    if (miniLightAreas.length) {
      const updated = miniLightAreas.map(a => ({ ...a, density: n }));
      setMiniLightAreas(updated);
    }
  };
  
  const handleMiniBrightnessChange = (n: number) => {
    setMiniLightBrightness(n);
    if (miniLightAreas.length) {
      const updated = miniLightAreas.map(a => ({ ...a, brightness: n }));
      setMiniLightAreas(updated);
    }
  };

  const handleUndo = () => {
    // If we're in the middle of drawing, remove last point or cancel
    if (isDrawing && currentRun.length > 0) {
      if (currentRun.length === 1) {
        setCurrentRun([]);
        setDrawingMode('idle');
      } else {
        setCurrentRun(prev => prev.slice(0, -1));
      }
      return;
    }
    
    if (isTracingMini && currentMiniTrace.length > 0) {
      setCurrentMiniTrace([]);
      setDrawingMode('idle');
      return;
    }
    
    // Otherwise, undo from global history
    const currentState: AppState = { lightRuns, miniLightAreas };
    const result = undoCommand(currentState, history);
    if (result) {
      setLightRuns(result.state.lightRuns);
      setMiniLightAreas(result.state.miniLightAreas);
      setHistory(result.history);
    }
  };

  const handleRedo = () => {
    const currentState: AppState = { lightRuns, miniLightAreas };
    const result = redoCommand(currentState, history);
    if (result) {
      setLightRuns(result.state.lightRuns);
      setMiniLightAreas(result.state.miniLightAreas);
      setHistory(result.history);
    }
  };

  const handleClearAll = () => {
    // Create delete commands for all existing runs and areas
    const commands: Command[] = [
      ...lightRuns.map(run => ({ kind: 'delete-run' as const, run })),
      ...miniLightAreas.map(area => ({ kind: 'delete-area' as const, area }))
    ];
    
    // Execute all commands
    let currentState: AppState = { lightRuns, miniLightAreas };
    let currentHistory = history;
    
    commands.forEach(command => {
      const result = executeCommand(currentState, currentHistory, command);
      currentState = result.state;
      currentHistory = result.history;
    });
    
    setLightRuns(currentState.lightRuns);
    setMiniLightAreas(currentState.miniLightAreas);
    setHistory(currentHistory);
  };

  const handleUndoLastPoint = () => {
    if (currentRun.length > 0) {
      setCurrentRun(prev => prev.slice(0, -1));
      if (currentRun.length === 1) setDrawingMode('idle');
    }
  };
  
  const handleCancelCurrentRun = () => {
    setCurrentRun([]);
    setCurrentMiniTrace([]);
    setDrawingMode('idle');
  };

  const handleUploadNewPhoto = () => {
    setUploadedImage(null);
    setLightRuns([]);
    setMiniLightAreas([]);
    setCurrentRun([]);
    setCurrentMiniTrace([]);
    setDrawingMode('idle');
    setHistory({ past: [], future: [] });
    setShowBefore(false);
  };

  const addToHistory = (newLightRuns: LightRun[], newMiniLightAreas?: MiniLightArea[]) => {
    // This is kept for compatibility with CanvasEditor
    // The actual history management is now done through executeAndApplyCommand
  };

  const downloadImage = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.download = "holiday-lights-mockup.png";
    a.href = c.toDataURL("image/png");
    a.click();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawingMode !== 'idle') {
        handleCancelCurrentRun();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawingMode, currentRun, currentMiniTrace, lightRuns, miniLightAreas, history]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-400">Holiday Light Mockup Tool</h1>
            <p className="text-gray-300 text-sm">Professional Christmas Light Visualization</p>
          </div>
          <div className="flex items-center gap-2">
            {uploadedImage && (
              <Button variant="outline" size="sm" onClick={handleUploadNewPhoto} className="text-gray-300 hover:text-white border-gray-600 hover:border-gray-500">
                <Upload className="w-4 h-4 mr-2" /> New Photo
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={history.past.length === 0 && currentRun.length === 0 && currentMiniTrace.length === 0} className="bg-slate-700 hover:bg-slate-600">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={history.future.length === 0} className="bg-slate-700 hover:bg-slate-600">
              <Redo className="w-4 h-4" />
            </Button>
            {(isDrawing || isTracingMini) && (
              <>
                <Button variant="outline" size="sm" onClick={handleUndoLastPoint} disabled={currentRun.length === 0 && currentMiniTrace.length === 0} className="bg-slate-700 hover:bg-slate-600">
                  <Eraser className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelCurrentRun} className="bg-slate-700 hover:bg-slate-600">
                  Cancel
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleClearAll} className="bg-slate-700 hover:bg-slate-600 text-red-400 hover:text-red-300">
              Clear All
            </Button>
            <Button onClick={downloadImage} disabled={!uploadedImage} className="bg-green-600 hover:bg-green-700 text-white">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-950">
          {!uploadedImage ? (
            <div className="flex-1 flex items-center justify-center">
              <ImageUpload onImageUploaded={setUploadedImage} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col relative">
              <div className="flex-1 relative">
                <CanvasEditor
                  ref={canvasRef}
                  image={uploadedImage}
                  lightRuns={lightRuns}
                  miniLightAreas={miniLightAreas}
                  selectedPattern={selectedPattern}
                  miniLightPattern={miniLightPattern}
                  bulbSpacing={bulbSpacing}
                  miniLightSize={miniLightSize}
                  miniLightDensity={miniLightDensity}
                  brightness={brightness}
                  miniLightBrightness={miniLightBrightness}
                  showBefore={showBefore}
                  isDrawing={isDrawing}
                  isTracingMini={isTracingMini}
                  onLightRunsChange={setLightRuns}
                  onMiniLightAreasChange={setMiniLightAreas}
                  onIsDrawingChange={(drawing) => setDrawingMode(drawing ? 'drawing-string' : 'idle')}
                  onIsTracingMiniChange={(tracing) => setDrawingMode(tracing ? 'tracing-mini' : 'idle')}
                  onAddToHistory={addToHistory}
                  onExecuteCommand={executeAndApplyCommand}
                  drawingMode={drawingMode}
                  onDrawingModeChange={setDrawingMode}
                  cooldownUntil={cooldownUntil}
                  onSetCooldown={setCooldownUntil}
                  currentRun={currentRun}
                  onCurrentRunChange={setCurrentRun}
                  currentMiniTrace={currentMiniTrace}
                  onCurrentMiniTraceChange={setCurrentMiniTrace}
                />

                {/* Before/After Toggle */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <BeforeAfterToggle showBefore={showBefore} onToggle={setShowBefore} />
                </div>
              </div>

              {/* Bottom Customize Bar */}
              <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">Customize String Lights</h3>
                    <div className="text-sm text-gray-300">Click to add points • Double-click to finish</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Light Colors</label>
                      <Select value={selectedPattern} onValueChange={handlePatternChange}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {[
                            ["warm-white", "Warm White"],
                            ["cool-white", "Cool White"],
                            ["multi-color", "Multi-Color"],
                            ["candy-cane", "Candy Cane"],
                            ["icicle", "Icicle"],
                            ["blue", "Blue"],
                            ["halloween", "Halloween"],
                            ["orange", "Orange"],
                          ].map(([value, label]) => (
                            <SelectItem key={value} value={value} className="text-white">
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bulb Spacing: {bulbSpacing}"</label>
                      <Slider value={[bulbSpacing]} onValueChange={v => handleSpacingChange(v[0])} min={6} max={18} step={1} />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>6"</span><span>18"</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Brightness: {brightness}%</label>
                      <Slider value={[brightness]} onValueChange={v => handleBrightnessChange(v[0])} min={20} max={100} step={5} />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>20%</span><span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Lights Section */}
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <h3 className="text-white font-semibold mb-4">Customize Mini Lights</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Light Colors</label>
                        <Select value={miniLightPattern} onValueChange={handleMiniPatternChange}>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder="Choose" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {[
                              ["warm-white", "Warm White"],
                              ["cool-white", "Cool White"],
                              ["multi-color", "Multi-Color"],
                              ["candy-cane", "Candy Cane"],
                              ["icicle", "Icicle"],
                              ["blue", "Blue"],
                              ["halloween", "Halloween"],
                              ["orange", "Orange"],
                            ].map(([value, label]) => (
                              <SelectItem key={value} value={value} className="text-white">
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Size: {miniLightSize.toFixed(1)}px</label>
                        <Slider value={[miniLightSize]} onValueChange={v => handleMiniSizeChange(v[0])} min={0.5} max={1.5} step={0.1} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Density: {miniLightDensity}%</label>
                        <Slider value={[miniLightDensity]} onValueChange={v => handleMiniDensityChange(v[0])} min={5} max={80} step={5} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Brightness: {miniLightBrightness}%</label>
                        <Slider value={[miniLightBrightness]} onValueChange={v => handleMiniBrightnessChange(v[0])} min={20} max={100} step={5} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        {uploadedImage && (
          <div className="w-full lg:w-80 bg-gray-800 border-l border-gray-700">
            <ControlsPanel
              selectedPattern={selectedPattern}
              onPatternChange={handlePatternChange}
              bulbSpacing={bulbSpacing}
              onSpacingChange={handleSpacingChange}
              brightness={brightness}
              onBrightnessChange={handleBrightnessChange}
              miniLightPattern={miniLightPattern}
              onMiniPatternChange={handleMiniPatternChange}
              miniLightSize={miniLightSize}
              onMiniSizeChange={handleMiniSizeChange}
              miniLightDensity={miniLightDensity}
              onMiniDensityChange={handleMiniDensityChange}
              miniLightBrightness={miniLightBrightness}
              onMiniBrightnessChange={handleMiniBrightnessChange}
              lightRuns={lightRuns}
              onLightRunsChange={setLightRuns}
              miniLightAreas={miniLightAreas}
              onMiniLightAreasChange={setMiniLightAreas}
              isDrawing={isDrawing}
              isTracingMini={isTracingMini}
              currentRun={currentRun}
              currentMiniTrace={currentMiniTrace}
              onUndoLastPoint={handleUndoLastPoint}
              onCancelCurrentRun={handleCancelCurrentRun}
              onUploadNewPhoto={handleUploadNewPhoto}
              onAddToHistory={addToHistory}
              onExecuteCommand={executeAndApplyCommand}
            />
          </div>
        )}
      </div>
    </div>
  );
}