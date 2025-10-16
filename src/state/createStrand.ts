import { State } from './State.js'

/**
 * Creates a new strand starting from a point
 */
export const createStrand = (
  state: State,
  x: number,
  y: number
): State => {
  const firstPointIndex = state.points.length
  const secondPointIndex = firstPointIndex + 1
  
  const newPoints = [...state.points, { x, y }, { x, y }]
  const newLines = [...state.lines, { a: firstPointIndex, b: secondPointIndex }]
  
  return {
    ...state,
    points: newPoints,
    lines: newLines,
    creatingStrandFromIndex: firstPointIndex,
    draggingPointIndex: secondPointIndex,
  }
}

