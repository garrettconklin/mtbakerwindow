import { State, PointIndex } from './State.js'
import { cleanupState } from './cleanupState.js'

/**
 * Deletes a point and handles line reconnection intelligently
 */
export const deletePoint = (state: State, pointIndex: PointIndex): State => {
  // Find all lines connected to this point
  const connectedLines = state.lines.filter(
    line => line.a === pointIndex || line.b === pointIndex
  )
  
  let newLines = [...state.lines]
  
  if (connectedLines.length === 2) {
    // Interior point: connect the other two points
    const line1 = connectedLines[0]
    const line2 = connectedLines[1]
    
    // Get the other endpoints (not the point being deleted)
    const otherPoint1 = line1.a === pointIndex ? line1.b : line1.a
    const otherPoint2 = line2.a === pointIndex ? line2.b : line2.a
    
    // Remove both old lines and add a new connecting line
    newLines = state.lines.filter(line => !connectedLines.includes(line))
    newLines.push({ a: otherPoint1, b: otherPoint2 })
  } else {
    // Exterior point: just remove attached lines
    newLines = state.lines.filter(
      line => line.a !== pointIndex && line.b !== pointIndex
    )
  }
  
  // Remove the point and adjust all line indices
  const newPoints = state.points.filter((_, idx) => idx !== pointIndex)
  const adjustedLines = newLines.map(line => ({
    a: line.a > pointIndex ? line.a - 1 : line.a,
    b: line.b > pointIndex ? line.b - 1 : line.b,
  }))
  
  const updatedState = {
    ...state,
    points: newPoints,
    lines: adjustedLines,
    selectedPointIndex: null,
    draggingPointIndex: null,
  }

  // Clean up any resulting duplicates or isolated points
  return cleanupState(updatedState)
}

