import ImageUpload from './elements/ImageUpload.js'
import styles from './App.module.css'

const App = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Holiday Light Mock-up</h1>
      <div className={styles.content}>
        <ImageUpload />
      </div>
    </div> 
  )
}

export default App

