import { useEffect, useRef } from 'react'
import { useAppContext } from '../useAppContext.js'
import styles from './LinesCanvas.module.css'

const LinesCanvas = () => {
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

    // Set canvas dimensions to match its displayed size
    const rect = canvas.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

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
    state.meshes.forEach(mesh => {
      if (mesh.length < 3) return // Need at least 3 points for a mesh

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
      
      // Generate organic light distribution using multiple overlapping patterns
      const lightPositions: { x: number; y: number }[] = []
      
      // Create multiple overlapping irregular patterns
      const patterns = [
        { offsetX: 0, offsetY: 0, spacing: lightSpacing },
        { offsetX: lightSpacing * 0.3, offsetY: lightSpacing * 0.2, spacing: lightSpacing * 1.4 },
        { offsetX: lightSpacing * 0.7, offsetY: lightSpacing * 0.8, spacing: lightSpacing * 1.1 }
      ]
      
      patterns.forEach(pattern => {
        const cols = Math.max(1, Math.floor(meshWidth / pattern.spacing))
        const rows = Math.max(1, Math.floor(meshHeight / pattern.spacing))
        
        for (let row = 0; row <= rows; row++) {
          for (let col = 0; col <= cols; col++) {
            // Add significant irregularity
            const noise1 = ((col * 73 + row * 137) % 1000) / 1000
            const noise2 = ((col * 149 + row * 211) % 1000) / 1000
            const noise3 = ((col * 257 + row * 313) % 1000) / 1000
            
            const offsetX = (noise1 - 0.5) * pattern.spacing * 0.8
            const offsetY = (noise2 - 0.5) * pattern.spacing * 0.8
            const skip = noise3 > 0.7 // Randomly skip some lights for more organic feel
            
            if (!skip) {
              const lightX = minX + pattern.offsetX + (col * pattern.spacing) + offsetX
              const lightY = minY + pattern.offsetY + (row * pattern.spacing) + offsetY
              
              lightPositions.push({ x: lightX, y: lightY })
            }
          }
        }
      })
      
      // Draw lights within the mesh polygon
      lightPositions.forEach(pos => {
        const lightX = pos.x
        const lightY = pos.y
          
          // Check if this point is inside the mesh polygon
          if (isPointInPolygon({ x: lightX, y: lightY }, mesh)) {
            // Create radial gradient for the mesh light
            const gradient = ctx.createRadialGradient(
              lightX, lightY, 0,           // Center point, inner radius
              lightX, lightY, 12           // Center point, outer radius (smaller for mesh)
            )
            
            // Add color stops for realistic light falloff
            gradient.addColorStop(0, '#FFFFFF')                      // Over-bright white center
            gradient.addColorStop(0.1, state.meshLightColor)         // Quick transition to mesh color
            gradient.addColorStop(0.2, state.meshLightColor + '80')  // Fade to 50% opacity
            gradient.addColorStop(0.5, state.meshLightColor + '40')  // Fade to 25% opacity
            gradient.addColorStop(1, state.meshLightColor + '00')    // Transparent edge
            
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
        
        // Add color stops for realistic light falloff
        gradient.addColorStop(0, '#FFFFFF')                      // Over-bright white center (actual bulb)
        gradient.addColorStop(0.1, state.lineLightColor)         // Quick transition to light color
        gradient.addColorStop(0.2, state.lineLightColor + '80')  // Fade to 50% opacity
        gradient.addColorStop(0.5, state.lineLightColor + '40')  // Fade to 25% opacity
        gradient.addColorStop(1, state.lineLightColor + '00')    // Transparent edge
        
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
  }, [state.points, state.lines, state.meshes, state.image, state.dragPath, state.dragMode, state.lineLightDensity, state.lineLightColor, state.meshLightDensity, state.meshLightColor])

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
    />
  )
}

export default LinesCanvas

