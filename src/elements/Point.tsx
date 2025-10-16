import { useAppContext } from '../useAppContext.js'
import { PointIndex } from '../state/State.js'
import styles from './Point.module.css'

export interface PointProps {
  readonly index: PointIndex;
}

const Point = ({ index }: PointProps) => {
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
        dragPath: [point],
        dragMode: 'strand',
      })
    } else {
      // Interior point: drag to move it
      patchState({ 
        draggingPointIndex: index,
        selectedPointIndex: index,
      })
    }
  }

  const isSelected = state.selectedPointIndex === index
  
  // Count how many lines this point is connected to
  const connectedLines = state.lines.filter(
    line => line.a === index || line.b === index
  )
  const isTerminal = connectedLines.length <= 1

  return (
    <div 
      className={`${styles.point} ${isSelected ? styles.selected : ''} ${isTerminal ? styles.terminal : styles.interior}`}
      style={{
        left: `${point.x}px`,
        top: `${point.y}px`,
      }}
      onMouseDown={handleMouseDown}
    />
  )
}

export default Point

