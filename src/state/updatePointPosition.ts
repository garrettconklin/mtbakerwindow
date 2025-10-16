import { State, PointIndex } from './State.js'

/**
 * Updates the position of a point
 */
export const updatePointPosition = (
  state: State,
  pointIndex: PointIndex,
  x: number,
  y: number
): State => {
  const newPoints = [...state.points]
  newPoints[pointIndex] = { x, y }
  
  return {
    ...state,
    points: newPoints,
  }
}

