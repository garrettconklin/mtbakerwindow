export type UUID = string;

export type LightRun = {
  id: UUID;
  points: { x: number; y: number }[];
  pattern: 'warm-white' | 'cool-white' | 'multi-color' | 'candy-cane' | 'icicle' | 'blue' | 'halloween' | 'orange';
  spacing: number;
  brightness: number;
  visible: boolean;
};

export type MiniLightArea = {
  id: UUID;
  points: { x: number; y: number }[];
  pattern: 'warm-white' | 'cool-white' | 'multi-color' | 'candy-cane' | 'icicle' | 'blue' | 'halloween' | 'orange';
  size: number;
  density: number;
  brightness: number;
  visible: boolean;
};

export type Command =
  | { kind: 'create-run'; run: LightRun }
  | { kind: 'delete-run'; run: LightRun }
  | { kind: 'update-run'; before: LightRun; after: LightRun }
  | { kind: 'create-area'; area: MiniLightArea }
  | { kind: 'delete-area'; area: MiniLightArea }
  | { kind: 'update-area'; before: MiniLightArea; after: MiniLightArea };

export interface AppState {
  lightRuns: LightRun[];
  miniLightAreas: MiniLightArea[];
}

export interface HistoryState {
  past: Command[];
  future: Command[];
}

export function applyCommand(state: AppState, command: Command): AppState {
  switch (command.kind) {
    case 'create-run':
      return {
        ...state,
        lightRuns: [...state.lightRuns, command.run]
      };
    
    case 'delete-run':
      return {
        ...state,
        lightRuns: state.lightRuns.filter(run => run.id !== command.run.id)
      };
    
    case 'update-run':
      return {
        ...state,
        lightRuns: state.lightRuns.map(run => 
          run.id === command.after.id ? command.after : run
        )
      };
    
    case 'create-area':
      return {
        ...state,
        miniLightAreas: [...state.miniLightAreas, command.area]
      };
    
    case 'delete-area':
      return {
        ...state,
        miniLightAreas: state.miniLightAreas.filter(area => area.id !== command.area.id)
      };
    
    case 'update-area':
      return {
        ...state,
        miniLightAreas: state.miniLightAreas.map(area => 
          area.id === command.after.id ? command.after : area
        )
      };
  }
}

export function reverseCommand(command: Command): Command {
  switch (command.kind) {
    case 'create-run':
      return { kind: 'delete-run', run: command.run };
    
    case 'delete-run':
      return { kind: 'create-run', run: command.run };
    
    case 'update-run':
      return { kind: 'update-run', before: command.after, after: command.before };
    
    case 'create-area':
      return { kind: 'delete-area', area: command.area };
    
    case 'delete-area':
      return { kind: 'create-area', area: command.area };
    
    case 'update-area':
      return { kind: 'update-area', before: command.after, after: command.before };
  }
}

export function executeCommand(
  state: AppState,
  history: HistoryState,
  command: Command
): { state: AppState; history: HistoryState } {
  const newState = applyCommand(state, command);
  const newHistory = {
    past: [...history.past, command],
    future: [] // Clear future when new command is executed
  };
  
  return { state: newState, history: newHistory };
}

export function undo(
  state: AppState,
  history: HistoryState
): { state: AppState; history: HistoryState } | null {
  if (history.past.length === 0) return null;
  
  const lastCommand = history.past[history.past.length - 1];
  const reverseCmd = reverseCommand(lastCommand);
  const newState = applyCommand(state, reverseCmd);
  
  const newHistory = {
    past: history.past.slice(0, -1),
    future: [lastCommand, ...history.future]
  };
  
  return { state: newState, history: newHistory };
}

export function redo(
  state: AppState,
  history: HistoryState
): { state: AppState; history: HistoryState } | null {
  if (history.future.length === 0) return null;
  
  const nextCommand = history.future[0];
  const newState = applyCommand(state, nextCommand);
  
  const newHistory = {
    past: [...history.past, nextCommand],
    future: history.future.slice(1)
  };
  
  return { state: newState, history: newHistory };
}