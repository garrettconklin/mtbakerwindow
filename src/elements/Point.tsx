import { useAppContext } from '../useAppContext.js'
import { PointIndex } from '../state/State.js'
import styles from './Point.module.css'

export interface PointProps {
  readonly index: PointIndex;
  readonly canvas: HTMLCanvasElement | null;
}

const Point = ({ index, canvas }: PointProps) => {
  const { state, patchState } = useAppContext()
  const point = state.points[index]
  
  if (!point) return null

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Count how many lines this point is connected to
    const connectedLines = state.lines.filter(
      line => line.a === index || line.b === index
    )
    
    const isTerminal = connectedLines.length <= 1
    
    if (isTerminal) {
      // Terminal point: create new strand extending from this point
      const firstPointIndex = index
      const secondPointIndex = state.points.length
      
      const newPoints = [...state.points, { x: point.x, y: point.y }]
      const newLines = [...state.lines, { a: firstPointIndex, b: secondPointIndex }]
      
      patchState({
        points: newPoints,
        lines: newLines,
        creatingStrandFromIndex: firstPointIndex,
        draggingPointIndex: secondPointIndex,
        selectedPointIndex: firstPointIndex,
        selectedMeshIndex: null, // Deselect any selected mesh
        dragPath: [point],
        dragMode: 'strand',
      })
    } else {
      // Interior point: drag to move it
      patchState({ 
        draggingPointIndex: index,
        selectedPointIndex: index,
        selectedMeshIndex: null, // Deselect any selected mesh
      })
    }
  }

  const isSelected = state.selectedPointIndex === index
  
  // Count how many lines this point is connected to
  const connectedLines = state.lines.filter(
    line => line.a === index || line.b === index
  )
  const isTerminal = connectedLines.length <= 1

  // Calculate canvas offset to center points relative to the canvas
  let pointX = point.x
  let pointY = point.y
  
  if (canvas) {
    const container = canvas.parentElement
    if (container) {
      const containerRect = container.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()
      
      // The canvas is centered, so we need to offset points to match canvas position
      // Canvas position relative to container
      const canvasLeft = canvasRect.left - containerRect.left
      const canvasTop = canvasRect.top - containerRect.top
      
      // Points should be positioned relative to the canvas top-left corner
      pointX = point.x + canvasLeft
      pointY = point.y + canvasTop
    }
  }

  return (
    <div 
      className={`${styles.point} ${isSelected ? styles.selected : ''} ${isTerminal ? styles.terminal : styles.interior}`}
      style={{
        left: `${pointX}px`,
        top: `${pointY}px`,
      }}
      onMouseDown={handleMouseDown}
    />
  )
}

export default Point

