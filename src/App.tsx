import ImageUpload from './elements/ImageUpload.js'
import PropertiesPanel from './elements/PropertiesPanel.js'
import styles from './App.module.css'

const App = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mt Baker Window</h1>
      <div className={styles.content}>
        <ImageUpload />
        <PropertiesPanel />
      </div>
    </div>
  )
}

export default App

