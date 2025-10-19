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
      
      {/* Instructions Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Instructions</h3>
        
        <div className={styles.instructions}>
          <div className={styles.instructionGroup}>
            <p className={styles.instructionSubtitle}>String Lights:</p>
            <ul className={styles.instructionList}>
              <li>Click starting point and drag to finish point to create String Light</li>
            </ul>
          </div>
          
          <div className={styles.instructionGroup}>
            <p className={styles.instructionSubtitle}>Mini Lights:</p>
            <ul className={styles.instructionList}>
              <li>Click + drag and trace area</li>
              <li>Release to finish area</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Download Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Export</h3>
        
        <button
          onClick={handleDownload}
          disabled={!canvas}
          className={styles.downloadButton}
        >
          Download Mockup
        </button>
      </div>
      
      {/* Dark Mode Section */}
      {state.image && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Dark Mode</h3>
          
          <div className={styles.property}>
            <label className={styles.label}>Darkness</label>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.1"
              value={state.imageDarkness}
              onChange={(e) => patchState({ imageDarkness: parseFloat(e.target.value) })}
              className={styles.slider}
            />
            <span className={styles.value}>{(state.imageDarkness * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
      
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
                    <div className={styles.control}>
                      <ColorDropdown
                        value={state.lineLightColor}
                        onChange={(color) => patchState({ lineLightColor: color })}
                      />
                    </div>
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
                    <div className={styles.control}>
                      <ColorDropdown
                        value={state.meshLightColor}
                        onChange={(color) => patchState({ meshLightColor: color })}
                      />
                    </div>
                  </div>
      </div>
    </div>
  )
}

export default PropertiesPanel
