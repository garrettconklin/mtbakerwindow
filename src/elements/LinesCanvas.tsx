import { useEffect, useRef } from 'react'
import { useAppContext } from '../useAppContext.js'
import styles from './LinesCanvas.module.css'

interface LinesCanvasProps {
  image: HTMLImageElement | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const LinesCanvas = ({ image, onCanvasReady }: LinesCanvasProps) => {
  const { state } = useAppContext()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Helper function to check if a point is inside a polygon
  const isPointInPolygon = (point: { x: number; y: number }, polygon: { x: number; y: number }[]) => {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside
      }
    }
    return inside
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
        const container = canvas.parentElement
        if (container) {
          const containerRect = container.getBoundingClientRect()
          const imageAspect = image.naturalWidth / image.naturalHeight
          
          // Use a reasonable max size for the canvas
          const maxWidth = Math.min(containerRect.width, 800)
          const maxHeight = Math.min(containerRect.height, 600)
          
          let canvasWidth, canvasHeight
          
          if (imageAspect > maxWidth / maxHeight) {
            // Image is wider - fit to width
            canvasWidth = maxWidth
            canvasHeight = maxWidth / imageAspect
          } else {
            // Image is taller - fit to height
            canvasHeight = maxHeight
            canvasWidth = maxHeight * imageAspect
          }
          
          
          canvas.style.width = `${canvasWidth}px`
          canvas.style.height = `${canvasHeight}px`
          canvas.width = canvasWidth
          canvas.height = canvasHeight
        }
      } else {
        // No image or image not loaded - use container size
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
      }

      // Now render the canvas content
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw the image if available
      if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      }

      // Draw darkening mask over the image
      if (state.imageDarkness > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${state.imageDarkness})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Notify parent that canvas is ready
      if (onCanvasReady) {
        onCanvasReady(canvas)
      }

      // Draw drag path preview if in mesh mode
      if (state.dragMode === 'mesh' && state.dragPath.length > 0) {
        ctx.beginPath()
        ctx.moveTo(state.dragPath[0].x, state.dragPath[0].y)
        for (let i = 1; i < state.dragPath.length; i++) {
          ctx.lineTo(state.dragPath[i].x, state.dragPath[i].y)
        }
        ctx.closePath()

        // Preview fill
        ctx.fillStyle = 'rgba(255, 100, 100, 0.2)' // Red tint to indicate mesh mode
        ctx.fill()

        // Preview outline
        ctx.strokeStyle = '#ff6666'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Draw mesh lights
      state.meshes.forEach((mesh, meshIndex) => {
        if (mesh.length < 3) return // Need at least 3 points for a mesh

        // Draw selection highlight for selected mesh
        const isSelected = state.selectedMeshIndex === meshIndex
        if (isSelected) {
          ctx.beginPath()
          ctx.moveTo(mesh[0].x, mesh[0].y)
          for (let i = 1; i < mesh.length; i++) {
            ctx.lineTo(mesh[i].x, mesh[i].y)
          }
          ctx.closePath()

          // Draw selection outline
          ctx.strokeStyle = '#00ffff'
          ctx.lineWidth = 3
          ctx.setLineDash([5, 5])
          ctx.stroke()
          ctx.setLineDash([])

          // Draw semi-transparent fill to show selection
          ctx.fillStyle = 'rgba(0, 255, 255, 0.1)'
          ctx.fill()
        }

        // Calculate mesh bounds for light distribution
        const minX = Math.min(...mesh.map(p => p.x))
        const maxX = Math.max(...mesh.map(p => p.x))
        const minY = Math.min(...mesh.map(p => p.y))
        const maxY = Math.max(...mesh.map(p => p.y))
        
        const meshWidth = maxX - minX
        const meshHeight = maxY - minY
        
        // Calculate light spacing based on density
        const baseSpacing = 8 // pixels between lights at density 1.0
        const lightSpacing = baseSpacing / state.meshLightDensity
        
        // Generate organic light distribution
        const lightPositions: { x: number; y: number }[] = []
        
        // Simple grid with organic variation
        const cols = Math.max(1, Math.floor(meshWidth / lightSpacing))
        const rows = Math.max(1, Math.floor(meshHeight / lightSpacing))
        
        for (let row = 0; row <= rows; row++) {
          for (let col = 0; col <= cols; col++) {
            // Add organic irregularity
            const noise1 = ((col * 73 + row * 137) % 1000) / 1000
            const noise2 = ((col * 149 + row * 211) % 1000) / 1000
            const noise3 = ((col * 257 + row * 313) % 1000) / 1000
            
            const offsetX = (noise1 - 0.5) * lightSpacing * 0.6
            const offsetY = (noise2 - 0.5) * lightSpacing * 0.6
            const skip = noise3 > 0.8 // Skip some lights for organic feel
            
            if (!skip) {
              const lightX = minX + (col * lightSpacing) + offsetX
              const lightY = minY + (row * lightSpacing) + offsetY
              
              lightPositions.push({ x: lightX, y: lightY })
            }
          }
        }
        
        // Draw lights within the mesh polygon
        lightPositions.forEach((pos, index) => {
          const lightX = pos.x
          const lightY = pos.y
            
            // Check if this point is inside the mesh polygon
            if (isPointInPolygon({ x: lightX, y: lightY }, mesh)) {
              // Create radial gradient for the mesh light
              const gradient = ctx.createRadialGradient(
                lightX, lightY, 0,           // Center point, inner radius
                lightX, lightY, 12           // Center point, outer radius (smaller for mesh)
              )
              
              // Get the color for this light position - alternate every bulb
              const colorIndex = index % state.meshLightColor.length
              const lightColor = state.meshLightColor[colorIndex]
              const colorString = `rgba(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]}, ${lightColor[3] / 255})`
              
              // Add color stops for realistic light falloff
              gradient.addColorStop(0, '#FFFFFF')                      // Over-bright white center
              gradient.addColorStop(0.1, colorString)                  // Quick transition to mesh color
              gradient.addColorStop(0.2, `rgba(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]}, 0.5)`)  // Fade to 50% opacity
              gradient.addColorStop(0.5, `rgba(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]}, 0.25)`) // Fade to 25% opacity
              gradient.addColorStop(1, `rgba(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]}, 0)`)      // Transparent edge
              
              // Set blending mode for realistic light interaction
              ctx.globalCompositeOperation = 'screen'
              
              // Draw the light
              ctx.fillStyle = gradient
              ctx.beginPath()
              ctx.arc(lightX, lightY, 12, 0, 2 * Math.PI)
              ctx.fill()
            }
        })
        
        // Reset blending mode
        ctx.globalCompositeOperation = 'source-over'
      })

      // Draw strand lights (skip temporary line if in mesh mode)
      state.lines.forEach((line) => {
        const pointA = state.points[line.a]
        const pointB = state.points[line.b]

        if (!pointA || !pointB) return

        // Skip rendering the temporary strand if we're in mesh mode
        if (state.dragMode === 'mesh' && 
            state.creatingStrandFromIndex !== null &&
            (line.a === state.creatingStrandFromIndex || line.b === state.creatingStrandFromIndex)) {
          return
        }

        // Calculate line length and light spacing
        const lineLength = Math.sqrt(
          Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2)
        )
        
        // Skip if line length is too small or invalid
        if (lineLength < 1 || !isFinite(lineLength)) {
          return
        }
        
        // Calculate light spacing based on density (0-1 maps to reasonable spacing)
        const baseSpacing = 10 // pixels between lights at density 1.0
        const lightSpacing = baseSpacing / state.lineLightDensity
        
        // Calculate how many lights fit and center them within the line
        const numLights = Math.max(1, Math.floor(lineLength / lightSpacing))
        const totalLightSpan = (numLights - 1) * lightSpacing
        const startOffset = (lineLength - totalLightSpan) / 2
        
        // Calculate light positions along the line
        for (let i = 0; i < numLights; i++) {
          const distanceFromStart = startOffset + (i * lightSpacing)
          const t = distanceFromStart / lineLength
          const lightX = pointA.x + (pointB.x - pointA.x) * t
          const lightY = pointA.y + (pointB.y - pointA.y) * t
          
          // Skip if we get invalid coordinates
          if (!isFinite(lightX) || !isFinite(lightY)) {
            continue
          }
          
          // Create radial gradient for the light
          const gradient = ctx.createRadialGradient(
            lightX, lightY, 0,           // Center point, inner radius
            lightX, lightY, 15           // Center point, outer radius (smaller)
          )
          
          // Get the color for this light position - alternate every bulb
          const colorIndex = i % state.lineLightColor.length
          const lightColor = state.lineLightColor[colorIndex]
          const colorString = `rgba(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]}, ${lightColor[3] / 255})`
          
          // Add color stops for realistic light falloff
          gradient.addColorStop(0, '#FFFFFF')                      // Over-bright white center (actual bulb)
          gradient.addColorStop(0.1, colorString)                  // Quick transition to light color
          gradient.addColorStop(0.2, `rgba(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]}, 0.5)`)  // Fade to 50% opacity
          gradient.addColorStop(0.5, `rgba(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]}, 0.25)`) // Fade to 25% opacity
          gradient.addColorStop(1, `rgba(${lightColor[0]}, ${lightColor[1]}, ${lightColor[2]}, 0)`)      // Transparent edge
          
          // Set blending mode for realistic light interaction
          ctx.globalCompositeOperation = 'screen'
          
          // Draw the light
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(lightX, lightY, 15, 0, 2 * Math.PI)
          ctx.fill()
        }
        
        // Reset blending mode
        ctx.globalCompositeOperation = 'source-over'
      })
    }

    // Initial sizing
    updateCanvasSize()

    // Set up resize observer for container size changes
    const resizeObserver = new ResizeObserver(updateCanvasSize)
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }

    return () => {
      resizeObserver.disconnect()
    }

  }, [image, state.points, state.lines, state.meshes, state.dragPath, state.dragMode, state.lineLightDensity, state.lineLightColor, state.meshLightDensity, state.meshLightColor, state.imageDarkness, state.selectedMeshIndex, onCanvasReady])

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
    />
  )
}

export default LinesCanvas

