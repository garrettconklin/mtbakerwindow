import { State, Point, PointIndex, Line } from './State.js'

/**
 * Removes isolated points (not connected to any lines) and duplicate lines
 */
export const cleanupState = (state: State): State => {
  // Find all points that are referenced by lines
  const usedPointIndices = new Set<PointIndex>()
  state.lines.forEach(line => {
    usedPointIndices.add(line.a)
    usedPointIndices.add(line.b)
  })

  // Remove duplicate/self-referencing lines
  const uniqueLines = new Map<string, Line>()
  state.lines.forEach(line => {
    // Skip self-referencing lines
    if (line.a === line.b) return
    
    // Create a consistent key (smaller index first)
    const key = line.a < line.b ? `${line.a}-${line.b}` : `${line.b}-${line.a}`
    
    if (!uniqueLines.has(key)) {
      uniqueLines.set(key, line)
    }
  })

  const cleanedLines = Array.from(uniqueLines.values())

  // Rebuild used points after line cleanup
  usedPointIndices.clear()
  cleanedLines.forEach(line => {
    usedPointIndices.add(line.a)
    usedPointIndices.add(line.b)
  })

  // Filter out unused points and build index mapping
  const indexMap = new Map<PointIndex, PointIndex>()
  const cleanedPoints: Point[] = []
  
  state.points.forEach((point, oldIndex) => {
    if (usedPointIndices.has(oldIndex)) {
      indexMap.set(oldIndex, cleanedPoints.length)
      cleanedPoints.push(point)
    }
  })

  // Remap line indices
  const remappedLines = cleanedLines.map(line => ({
    a: indexMap.get(line.a)!,
    b: indexMap.get(line.b)!,
  }))

  return {
    ...state,
    points: cleanedPoints,
    lines: remappedLines,
    selectedPointIndex: state.selectedPointIndex !== null && indexMap.has(state.selectedPointIndex)
      ? indexMap.get(state.selectedPointIndex)!
      : null,
    draggingPointIndex: state.draggingPointIndex !== null && indexMap.has(state.draggingPointIndex)
      ? indexMap.get(state.draggingPointIndex)!
      : null,
    creatingStrandFromIndex: state.creatingStrandFromIndex !== null && indexMap.has(state.creatingStrandFromIndex)
      ? indexMap.get(state.creatingStrandFromIndex)!
      : null,
  }
}

