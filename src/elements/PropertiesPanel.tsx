import { useAppContext } from '../useAppContext.js'
import styles from './PropertiesPanel.module.css'

const PropertiesPanel = () => {
  const { state, patchState } = useAppContext()

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Light Properties</h2>
      
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
          <input
            type="color"
            value={state.lineLightColor}
            onChange={(e) => patchState({ lineLightColor: e.target.value })}
            className={styles.colorInput}
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
          <input
            type="color"
            value={state.meshLightColor}
            onChange={(e) => patchState({ meshLightColor: e.target.value })}
            className={styles.colorInput}
          />
        </div>
      </div>
    </div>
  )
}

export default PropertiesPanel
