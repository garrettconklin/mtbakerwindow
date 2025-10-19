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
      <div className={styles.instructionsSection}>
        <h3 className={styles.sectionTitle}>Instructions</h3>
        
        <div className={styles.instructions}>
          <div className={styles.instructionGroup}>
            <p className={styles.instructionSubtitle}>String Lights: <i>For Edges of Homes</i></p>
            <ul className={styles.instructionList}>
              <li>Click + drag in straight line</li>
              <li>Use String Lights Menu to adjust spacing and color</li>
            </ul>
          </div>
          
          <div className={styles.instructionGroup}>
            <p className={styles.instructionSubtitle}>Mesh Lights: <i>For Trees and Bushes</i></p>
            <ul className={styles.instructionList}>
              <li>Click + drag and trace area</li>
              <li>Use Mesh Lights Menu to adjust spacing and color</li>
            </ul>
          </div>

          <div className={styles.instructionGroup}>
            <p className={styles.instructionSubtitle}>Selection:</p>
            <ul className={styles.instructionList}>
              <li>Select light by clicking end points</li>
              <li>Delete lights with the delete key</li>
            </ul>
          </div>

          <div className={styles.instructionGroup}>
            <p className={styles.instructionSubtitle}>Download:</p>
            <ul className={styles.instructionList}>
              <li>Use export button to download the mockup</li>
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
      
      {/* Night Mode Section */}
      {state.image && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Night Mode</h3>
          
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
        <h3 className={styles.sectionTitle}>Strings Lights</h3>
        
        <div className={styles.property}>
          <label className={styles.label}>Bulb Spacing</label>
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
          <label className={styles.label}>Bulb Spacing</label>
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
