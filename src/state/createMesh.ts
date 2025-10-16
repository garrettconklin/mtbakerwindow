import { State, Point } from './State.js'

/**
 * Creates a new mesh from a path of points
 */
export const createMesh = (
  state: State,
  points: Point[]
): State => {
  // Only create mesh if we have at least 3 points
  if (points.length < 3) return state

  const newMeshes = [...state.meshes, points]
  
  return {
    ...state,
    meshes: newMeshes,
    draggingPointIndex: null,
    creatingStrandFromIndex: null,
  }
}

