import { useAppContext } from '../useAppContext.js'
import ColorDropdown from './ColorDropdown.js'
import styles from './PropertiesPanel.module.css'

interface PropertiesPanelProps {
  canvas: HTMLCanvasElement | null;
}

const PropertiesPanel = ({ canvas }: PropertiesPanelProps) => {
  const { state, patchState } = useAppContext()

  const handleDownload = () => {
    if (!canvas) return

    // Create a temporary link element
    const link = document.createElement('a')
    link.download = 'christmas-light-plan.png'
    
    // Convert canvas to data URL
    const dataURL = canvas.toDataURL('image/png')
    link.href = dataURL
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Light Properties</h2>
      
      {/* Download Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Export</h3>
        
        <button
          onClick={handleDownload}
          disabled={!canvas}
          className={styles.downloadButton}
        >
          📸 Download Image
        </button>
      </div>
      
      {/* Line Light Properties */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Line Lights</h3>
        
        <div className={styles.property}>
          <label className={styles.label}>Density</label>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.1"
            value={state.lineLightDensity}
            onChange={(e) => patchState({ lineLightDensity: parseFloat(e.target.value) })}
            className={styles.slider}
          />
          <span className={styles.value}>{state.lineLightDensity.toFixed(1)}</span>
        </div>
        
                  <div className={styles.property}>
                    <label className={styles.label}>Color</label>
                    <ColorDropdown
                      value={state.lineLightColor}
                      onChange={(color) => patchState({ lineLightColor: color })}
                    />
                  </div>
      </div>
      
      {/* Mesh Light Properties */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Mesh Lights</h3>
        
        <div className={styles.property}>
          <label className={styles.label}>Density</label>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.1"
            value={state.meshLightDensity}
            onChange={(e) => patchState({ meshLightDensity: parseFloat(e.target.value) })}
            className={styles.slider}
          />
          <span className={styles.value}>{state.meshLightDensity.toFixed(1)}</span>
        </div>
        
                  <div className={styles.property}>
                    <label className={styles.label}>Color</label>
                    <ColorDropdown
                      value={state.meshLightColor}
                      onChange={(color) => patchState({ meshLightColor: color })}
                    />
                  </div>
      </div>
    </div>
  )
}

export default PropertiesPanel
