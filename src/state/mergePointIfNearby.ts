import { State, PointIndex } from './State.js'
import { cleanupState } from './cleanupState.js'

/**
 * Merges a dragged point with a nearby point if within threshold
 */
export const mergePointIfNearby = (
  state: State,
  draggedIndex: PointIndex,
  snapThreshold: number = 20
): State => {
  const draggedPoint = state.points[draggedIndex]
  
  // Find nearby point (excluding the dragged point and the anchor if creating)
  let nearbyPointIndex: PointIndex | null = null
  for (let i = 0; i < state.points.length; i++) {
    if (i === draggedIndex) continue
    if (i === state.creatingStrandFromIndex) continue
    
    const point = state.points[i]
    const distance = Math.sqrt(
      Math.pow(point.x - draggedPoint.x, 2) + 
      Math.pow(point.y - draggedPoint.y, 2)
    )
    
    if (distance < snapThreshold) {
      nearbyPointIndex = i
      break
    }
  }
  
  if (nearbyPointIndex === null) {
    // No merge
    return state
  }

  // Merge: remove the dragged point and update all lines that reference it
  const removedIndex = draggedIndex
  const targetIndex = nearbyPointIndex
  
  const newPoints = state.points.filter((_, idx) => idx !== removedIndex)
  const newLines = state.lines.map(line => {
    const adjustIndex = (idx: PointIndex): PointIndex => {
      if (idx === removedIndex) {
        return targetIndex > removedIndex ? targetIndex - 1 : targetIndex
      }
      return idx > removedIndex ? idx - 1 : idx
    }
    
    return { a: adjustIndex(line.a), b: adjustIndex(line.b) }
  })
  
  const updatedState = {
    ...state,
    points: newPoints,
    lines: newLines,
    draggingPointIndex: null,
    creatingStrandFromIndex: null,
  }

  // Clean up any resulting duplicates or isolated points
  return cleanupState(updatedState)
}

