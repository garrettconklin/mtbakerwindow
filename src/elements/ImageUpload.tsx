import React, { useState, useEffect } from 'react'
import { useAppContext } from '../useAppContext.js'
import { createStrand } from '../state/createStrand.js'
import { updatePointPosition } from '../state/updatePointPosition.js'
import { mergePointIfNearby } from '../state/mergePointIfNearby.js'
import { deletePoint } from '../state/deletePoint.js'
import { createMesh } from '../state/createMesh.js'
import Point from './Point.js'
import LinesCanvas from './LinesCanvas.js'
import PropertiesPanel from './PropertiesPanel.js'
import styles from './ImageUpload.module.css'

const MESH_RATIO_THRESHOLD = 0.15;
const MERGE_THRESHOLD = 10;
const CLICK_THRESHOLD = 5; // pixels - distance to consider it a click vs drag

const ImageUpload = () => {
  const { state, patchState } = useAppContext()
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  
  const minPointDistance = 10 // pixels

  // Load image when state.image changes
  useEffect(() => {
    if (state.image) {
      const img = new Image()
      img.onload = () => {
        setLoadedImage(img)
      }
      img.src = state.image
    } else {
      setLoadedImage(null)
    }
  }, [state.image])

  const handleCanvasReady = (canvasElement: HTMLCanvasElement) => {
    setCanvas(canvasElement)
  }

  // Calculate the area of a polygon using the shoelace formula
  const calculatePolygonArea = (points: { x: number; y: number }[]) => {
    if (points.length < 3) return 0
    
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    return Math.abs(area / 2)
  }

  // Calculate the "span" of the path - either max distance between any two points
  // or the diagonal of the bounding box, whichever is larger
  const calculatePathSpan = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return 0
    
    // Calculate bounding box
    const minX = Math.min(...points.map(p => p.x))
    const maxX = Math.max(...points.map(p => p.x))
    const minY = Math.min(...points.map(p => p.y))
    const maxY = Math.max(...points.map(p => p.y))
    
    const boundingBoxDiagonal = Math.sqrt(
      Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)
    )
    
    // Also check max distance between any two points
    let maxPointDistance = 0
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = Math.sqrt(
          Math.pow(points[i].x - points[j].x, 2) + 
          Math.pow(points[i].y - points[j].y, 2)
        )
        maxPointDistance = Math.max(maxPointDistance, dist)
      }
    }
    
    // Use the larger of the two as our "span" measurement
    return Math.max(boundingBoxDiagonal, maxPointDistance)
  }

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return
    
    const blobUrl = URL.createObjectURL(file)
    patchState({ image: blobUrl })
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (state.selectedPointIndex === null) return
      
      const newState = deletePoint(state, state.selectedPointIndex)
      patchState({
        points: newState.points,
        lines: newState.lines,
        selectedPointIndex: newState.selectedPointIndex,
        draggingPointIndex: newState.draggingPointIndex,
      })
    } else if (e.key === 'Escape') {
      // Deselect any selected point
      if (state.selectedPointIndex !== null) {
        patchState({ selectedPointIndex: null })
      }
    }
  }

  // Add keyboard listener
  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.selectedPointIndex, state.points, state.lines])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files[0])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks on the container itself, not on child elements
    if (e.target !== e.currentTarget) return
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newState = createStrand(state, x, y)
    patchState({
      points: newState.points,
      lines: newState.lines,
      creatingStrandFromIndex: newState.creatingStrandFromIndex,
      draggingPointIndex: newState.draggingPointIndex,
      dragPath: [{ x, y }],
      dragMode: 'strand',
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (state.draggingPointIndex === null) return
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Only track gesture if we're creating a new strand
    if (state.creatingStrandFromIndex !== null) {
      const currentPoint = { x, y }
      const dragPath = state.dragPath
      
      let newDragPath = dragPath
      let newDragMode = state.dragMode
      
      // Add point if it's far enough from the last recorded point
      if (dragPath.length === 0) {
        newDragPath = [currentPoint]
      } else {
        const lastPoint = dragPath[dragPath.length - 1]
        const distance = Math.sqrt(
          Math.pow(currentPoint.x - lastPoint.x, 2) + 
          Math.pow(currentPoint.y - lastPoint.y, 2)
        )
        
        if (distance >= minPointDistance) {
          newDragPath = [...dragPath, currentPoint]
          
          // Check if path forms a mesh (area-based detection)
          if (newDragPath.length > 4 && state.dragMode === 'strand') {
            const area = calculatePolygonArea(newDragPath)
            const pathSpan = calculatePathSpan(newDragPath)
            
            // Normalize: area / (span^2)
            // For a straight line, this ratio is close to 0
            // For a filled shape, this ratio is larger
            const ratio = pathSpan > 0 ? area / (pathSpan * pathSpan) : 0
            
            // Switch to mesh mode when area ratio indicates a filled shape
            if (ratio >= MESH_RATIO_THRESHOLD) {
              newDragMode = 'mesh'
            }
          }
        }
      }
      
      const newState = updatePointPosition(state, state.draggingPointIndex, x, y)
      patchState({ 
        points: newState.points,
        dragPath: newDragPath,
        dragMode: newDragMode,
      })
    } else {
      const newState = updatePointPosition(state, state.draggingPointIndex, x, y)
      patchState({ points: newState.points })
    }
  }

  const handleMouseUp = () => {
    if (state.draggingPointIndex === null) return

    // Check if we were creating a new gesture
    if (state.creatingStrandFromIndex !== null) {
      const mode = state.dragMode
      const draggedPoint = state.points[state.draggingPointIndex]
      const startPoint = state.points[state.creatingStrandFromIndex]
      
      // Check if this was just a click (didn't move far)
      const distanceMoved = Math.sqrt(
        Math.pow(draggedPoint.x - startPoint.x, 2) + 
        Math.pow(draggedPoint.y - startPoint.y, 2)
      )
      
      if (distanceMoved < CLICK_THRESHOLD) {
        // It was just a click - remove the temporary point and line, select the original
        const pointsWithoutTemp = state.points.slice(0, -1) // Remove the last point (the temporary one we just created)
        const linesWithoutTemp = state.lines.slice(0, -1) // Remove the last line (the temporary one we just created)
        
        patchState({
          points: pointsWithoutTemp,
          lines: linesWithoutTemp,
          draggingPointIndex: null,
          creatingStrandFromIndex: null,
          selectedPointIndex: state.creatingStrandFromIndex,
          dragPath: [],
          dragMode: null,
        })
        return
      }
      
      if (mode === 'mesh') {
        // Remove the temporary strand points we created
        const pointsWithoutTemp = state.points.slice(0, state.creatingStrandFromIndex!)
        const linesWithoutTemp = state.lines.filter(
          line => line.a < state.creatingStrandFromIndex! && line.b < state.creatingStrandFromIndex!
        )
        
        // Create mesh from the drag path
        const meshState = createMesh(
          { ...state, points: pointsWithoutTemp, lines: linesWithoutTemp },
          state.dragPath
        )
        
        patchState({
          points: meshState.points,
          lines: meshState.lines,
          meshes: meshState.meshes,
          draggingPointIndex: null,
          creatingStrandFromIndex: null,
          dragPath: [],
          dragMode: null,
        })
      } else {
        // Strand mode - use existing merge logic
        const newState = mergePointIfNearby(state, state.draggingPointIndex, MERGE_THRESHOLD)
        
        if (newState !== state) {
          // Merge occurred
          patchState({
            points: newState.points,
            lines: newState.lines,
            draggingPointIndex: newState.draggingPointIndex,
            creatingStrandFromIndex: newState.creatingStrandFromIndex,
            selectedPointIndex: newState.selectedPointIndex,
            dragPath: [],
            dragMode: null,
          })
        } else {
          // No merge, just stop dragging
          patchState({
            draggingPointIndex: null,
            creatingStrandFromIndex: null,
            dragPath: [],
            dragMode: null,
          })
        }
      }
    } else {
      // Dragging existing point - use merge logic
      const newState = mergePointIfNearby(state, state.draggingPointIndex, 20)
      
      if (newState !== state) {
        patchState({
          points: newState.points,
          lines: newState.lines,
          draggingPointIndex: newState.draggingPointIndex,
          creatingStrandFromIndex: newState.creatingStrandFromIndex,
          selectedPointIndex: newState.selectedPointIndex,
        })
      } else {
        patchState({ draggingPointIndex: null })
      }
    }
  }

  const preventDragDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      {state.image ? (
        <div 
          className={styles.imageContainer}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragStart={preventDragDrop}
          onDrop={preventDragDrop}
          onDragOver={preventDragDrop}
        >
          <LinesCanvas 
            image={loadedImage}
            onCanvasReady={handleCanvasReady}
          />
          {state.points.map((_, index) => (
            <Point key={index} index={index} canvas={canvas} />
          ))}
        </div>
      ) : (
    <label
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={styles.uploadArea}
    >
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        className={styles.fileInput}
      />
      <div className={styles.uploadIcon}>
        📸
      </div>
      <div className={styles.uploadTitle}>
        Upload a photo of your house
      </div>
      <div className={styles.uploadSubtitle}>
        Click to browse or drag and drop an image here
      </div>
    </label>
      )}
      <PropertiesPanel canvas={canvas} />
    </>
  )
}

export default ImageUpload

