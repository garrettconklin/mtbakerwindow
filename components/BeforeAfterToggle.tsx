"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

interface BeforeAfterToggleProps {
  showBefore: boolean;
  onToggle: (show: boolean) => void;
}

export function BeforeAfterToggle({ showBefore, onToggle }: BeforeAfterToggleProps) {
  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
      <Button
        variant={showBefore ? "default" : "ghost"}
        size="sm"
        onClick={() => onToggle(true)}
        className="flex items-center gap-2"
      >
        <Sun className="w-4 h-4" />
        Before
      </Button>
      <Button
        variant={!showBefore ? "default" : "ghost"}
        size="sm"
        onClick={() => onToggle(false)}
        className="flex items-center gap-2"
      >
        <Moon className="w-4 h-4" />
        After
      </Button>
    </div>
  );
}