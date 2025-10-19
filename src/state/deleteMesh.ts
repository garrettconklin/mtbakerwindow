import { State, MeshIndex } from './State.js'

/**
 * Deletes a mesh at the specified index
 */
export const deleteMesh = (state: State, meshIndex: MeshIndex): State => {
  // Remove the mesh at the specified index
  const newMeshes = state.meshes.filter((_, idx) => idx !== meshIndex)
  
  return {
    ...state,
    meshes: newMeshes,
    selectedMeshIndex: null,
  }
}

