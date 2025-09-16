"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Eye, EyeOff, Upload } from 'lucide-react';
import { LightRun, MiniLightArea } from '@/app/page';
import { Command } from '@/lib/commandHistory';

interface ControlsPanelProps {
  selectedPattern: 'warm-white' | 'cool-white' | 'multi-color' | 'candy-cane' | 'icicle' | 'blue' | 'halloween' | 'orange';
  onPatternChange: (pattern: 'warm-white' | 'cool-white' | 'multi-color' | 'candy-cane' | 'icicle' | 'blue' | 'halloween' | 'orange') => void;
  bulbSpacing: number;
  onSpacingChange: (spacing: number) => void;
  brightness: number;
  onBrightnessChange: (brightness: number) => void;
  miniLightPattern: 'warm-white' | 'cool-white' | 'multi-color' | 'candy-cane' | 'icicle' | 'blue' | 'halloween' | 'orange';
  onMiniPatternChange: (pattern: 'warm-white' | 'cool-white' | 'multi-color' | 'candy-cane' | 'icicle' | 'blue' | 'halloween' | 'orange') => void;
  miniLightSize: number;
  onMiniSizeChange: (size: number) => void;
  miniLightDensity: number;
  onMiniDensityChange: (density: number) => void;
  miniLightBrightness: number;
  onMiniBrightnessChange: (brightness: number) => void;
  lightRuns: LightRun[];
  onLightRunsChange: (runs: LightRun[]) => void;
  miniLightAreas: MiniLightArea[];
  onMiniLightAreasChange: (areas: MiniLightArea[]) => void;
  isDrawing: boolean;
  isTracingMini: boolean;
  currentRun: { x: number; y: number }[];
  currentMiniTrace: { x: number; y: number }[];
  onUndoLastPoint?: () => void;
  onCancelCurrentRun?: () => void;
  onUploadNewPhoto?: () => void;
  onAddToHistory: (lightRuns: LightRun[], miniAreas?: MiniLightArea[]) => void;
  onExecuteCommand: (command: Command) => void;
}

export function ControlsPanel({
  selectedPattern,
  onPatternChange,
  bulbSpacing,
  onSpacingChange,
  brightness,
  onBrightnessChange,
  miniLightPattern,
  onMiniPatternChange,
  miniLightSize,
  onMiniSizeChange,
  miniLightDensity,
  onMiniDensityChange,
  miniLightBrightness,
  onMiniBrightnessChange,
  lightRuns,
  onLightRunsChange,
  miniLightAreas,
  onMiniLightAreasChange,
  isDrawing,
  isTracingMini,
  currentRun,
  currentMiniTrace,
  onUndoLastPoint,
  onCancelCurrentRun,
  onUploadNewPhoto,
  onAddToHistory,
  onExecuteCommand,
}: ControlsPanelProps) {
  const patternColors: Record<string, string> = {
    'warm-white': '#FFF8DC',
    'cool-white': '#F0F8FF',
    'multi-color': '#FF6B6B',
    'candy-cane': '#FF6B6B',
    'icicle': '#87CEEB',
    'blue': '#287CDC',
    'halloween': '#FF7828',
    'orange': '#FF7828'
  };

  const patternLabels: Record<string, string> = {
    'warm-white': 'Warm White',
    'cool-white': 'Cool White',
    'multi-color': 'Multi-Color',
    'candy-cane': 'Candy Cane',
    'icicle': 'Icicle',
    'blue': 'Blue',
    'halloween': 'Halloween',
    'orange': 'Orange'
  };

  const toggleRunVisibility = (runId: string) => {
    const run = lightRuns.find(r => r.id === runId);
    if (run) {
      const command: Command = {
        kind: 'update-run',
        before: run,
        after: { ...run, visible: !run.visible }
      };
      onExecuteCommand(command);
    }
  };

  const deleteRun = (runId: string) => {
    const run = lightRuns.find(r => r.id === runId);
    if (run) {
      const command: Command = {
        kind: 'delete-run',
        run
      };
      onExecuteCommand(command);
    }
  };

  const toggleMiniAreaVisibility = (areaId: string) => {
    const area = miniLightAreas.find(a => a.id === areaId);
    if (area) {
      const command: Command = {
        kind: 'update-area',
        before: area,
        after: { ...area, visible: !area.visible }
      };
      onExecuteCommand(command);
    }
  };

  const deleteMiniArea = (areaId: string) => {
    const area = miniLightAreas.find(a => a.id === areaId);
    if (area) {
      const command: Command = {
        kind: 'delete-area',
        area
      };
      onExecuteCommand(command);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Instructions */}
      <Card className="bg-gray-900 border-gray-700 p-4">
        <h3 className="text-white font-semibold mb-3">Instructions</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <p><strong>String Lights:</strong></p>
          <p>• Left click to start/continue line</p>
          <p>• Double-click to finish</p>
          <p><strong>Mini Lights:</strong></p>
          <p>• Hold Shift + drag to trace area</p>
          <p>• Release to finish area, move mouse outside to exit mode</p>
        </div>
      </Card>

      {/* String Light Controls */}
      <Card className="bg-gray-900 border-gray-700 p-4">
        <h3 className="text-white font-semibold mb-3">Light Settings</h3>
        
        {/* Light Color Scheme */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Light Colors
          </label>
          <Select value={selectedPattern} onValueChange={onPatternChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {Object.entries(patternLabels).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-white hover:bg-gray-600 focus:bg-gray-600">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: patternColors[value] }}
                    />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulb Spacing */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bulb Spacing: {bulbSpacing}"
          </label>
          <Slider
            value={[bulbSpacing]}
            onValueChange={(value) => onSpacingChange(value[0])}
            min={6}
            max={18}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>6"</span>
            <span>18"</span>
          </div>
        </div>

        {/* Brightness */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Brightness: {brightness}%
          </label>
          <Slider
            value={[brightness]}
            onValueChange={(value) => onBrightnessChange(value[0])}
            min={20}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>20%</span>
            <span>100%</span>
          </div>
        </div>
      </Card>

      {/* Mini Light Controls */}
      <Card className="bg-gray-900 border-gray-700 p-4">
        <h3 className="text-white font-semibold mb-3">Mini Light Settings</h3>
        
        {/* Light Color Scheme */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Light Colors
          </label>
          <Select value={miniLightPattern} onValueChange={onMiniPatternChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {Object.entries(patternLabels).map(([value, label]) => (
                <SelectItem key={value} value={value} className="text-white hover:bg-gray-600 focus:bg-gray-600">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: patternColors[value] }}
                    />
                    {label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Size */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Size: {miniLightSize.toFixed(1)}px
          </label>
          <Slider
            value={[miniLightSize]}
            onValueChange={(value) => onMiniSizeChange(value[0])}
            min={0.5}
            max={1.5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0.5px</span>
            <span>1.5px</span>
          </div>
        </div>

        {/* Density */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Density: {miniLightDensity}%
          </label>
          <Slider
            value={[miniLightDensity]}
            onValueChange={(value) => onMiniDensityChange(value[0])}
            min={5}
            max={80}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5%</span>
            <span>80%</span>
          </div>
        </div>

        {/* Brightness */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Brightness: {miniLightBrightness}%
          </label>
          <Slider
            value={[miniLightBrightness]}
            onValueChange={(value) => onMiniBrightnessChange(value[0])}
            min={20}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>20%</span>
            <span>100%</span>
          </div>
        </div>
      </Card>

      {/* Light Runs */}
      {lightRuns.length > 0 && (
        <Card className="bg-gray-900 border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-3">String Light Runs ({lightRuns.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {lightRuns.map((run, index) => (
              <div key={run.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: patternColors[run.pattern] }}
                  />
                  <span className="text-sm text-gray-300">
                    Run {index + 1}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {patternLabels[run.pattern]}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRunVisibility(run.id)}
                    className="p-1 h-auto hover:bg-gray-700"
                  >
                    {run.visible ? (
                      <Eye className="w-3 h-3 text-green-400 opacity-100" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400 opacity-100" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRun(run.id)}
                    className="p-1 h-auto text-red-400 hover:text-red-300 hover:bg-gray-700"
                  >
                    <Trash2 className="w-3 h-3 opacity-100" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Mini Light Areas */}
      {miniLightAreas.length > 0 && (
        <Card className="bg-gray-900 border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-3">Mini Light Areas ({miniLightAreas.length})</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {miniLightAreas.map((area, index) => (
              <div key={area.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: patternColors[area.pattern] }}
                  />
                  <span className="text-sm text-gray-300">
                    Area {index + 1}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {patternLabels[area.pattern]}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMiniAreaVisibility(area.id)}
                    className="p-1 h-auto hover:bg-gray-700"
                  >
                    {area.visible ? (
                      <Eye className="w-3 h-3 text-green-400 opacity-100" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400 opacity-100" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMiniArea(area.id)}
                    className="p-1 h-auto text-red-400 hover:text-red-300 hover:bg-gray-700"
                  >
                    <Trash2 className="w-3 h-3 opacity-100" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}