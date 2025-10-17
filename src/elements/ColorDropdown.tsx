import React from 'react'
import styles from './ColorDropdown.module.css'

export interface ColorOption {
  readonly name: string;
  readonly value: number[][]; // Array of RGBA values [r, g, b, a]
  readonly preview: string;
}

// Helper function to convert RGBA array to hex string
const rgbaToHex = (rgba: number[]): string => {
  const [r, g, b] = rgba.map(Math.round)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Helper function to create gradient preview for multi-color sequences
const createGradientPreview = (colors: number[][]): string => {
  if (colors.length === 1) return rgbaToHex(colors[0])
  
  const gradient = colors.map((color, index) => {
    const hex = rgbaToHex(color)
    const percent = (index / (colors.length - 1)) * 100
    return `${hex} ${percent}%`
  }).join(', ')
  
  return `linear-gradient(90deg, ${gradient})`
}

export const CHRISTMAS_COLORS: ColorOption[] = [
  // Solid Colors
  { name: 'Warm White', value: [[255, 248, 220, 255]], preview: '#FFF8DC' },
  { name: 'Cool White', value: [[240, 248, 255, 255]], preview: '#F0F8FF' },
  { name: 'Classic Red', value: [[220, 20, 60, 255]], preview: '#DC143C' },
  { name: 'Classic Green', value: [[34, 139, 34, 255]], preview: '#228B22' },
  { name: 'Classic Blue', value: [[0, 0, 255, 255]], preview: '#0000FF' },
  { name: 'Golden Yellow', value: [[255, 215, 0, 255]], preview: '#FFD700' },
  { name: 'Bright Orange', value: [[255, 69, 0, 255]], preview: '#FF4500' },
  { name: 'Royal Blue', value: [[65, 105, 225, 255]], preview: '#4169E1' },
  { name: 'Deep Purple', value: [[75, 0, 130, 255]], preview: '#4B0082' },
  { name: 'Hot Pink', value: [[255, 20, 147, 255]], preview: '#FF1493' },
  
  // Classic Christmas Combinations
  { 
    name: 'Red & Green', 
    value: [[220, 20, 60, 255], [34, 139, 34, 255]], 
    preview: 'linear-gradient(90deg, #DC143C 0%, #228B22 100%)' 
  },
  { 
    name: 'Red, White & Blue', 
    value: [[220, 20, 60, 255], [255, 255, 255, 255], [0, 0, 255, 255]], 
    preview: 'linear-gradient(90deg, #DC143C 0%, #FFFFFF 50%, #0000FF 100%)' 
  },
  { 
    name: 'Traditional Christmas', 
    value: [[220, 20, 60, 255], [34, 139, 34, 255], [255, 215, 0, 255]], 
    preview: 'linear-gradient(90deg, #DC143C 0%, #228B22 50%, #FFD700 100%)' 
  },
  { 
    name: 'Rainbow Classic', 
    value: [[255, 0, 0, 255], [255, 165, 0, 255], [255, 255, 0, 255], [0, 128, 0, 255], [0, 0, 255, 255], [75, 0, 130, 255]], 
    preview: 'linear-gradient(90deg, #FF0000 0%, #FFA500 20%, #FFFF00 40%, #008000 60%, #0000FF 80%, #4B0082 100%)' 
  },
  { 
    name: 'Winter Blues', 
    value: [[65, 105, 225, 255], [135, 206, 250, 255], [176, 224, 230, 255]], 
    preview: 'linear-gradient(90deg, #4169E1 0%, #87CEEB 50%, #B0E0E6 100%)' 
  },
  { 
    name: 'Warm Glow', 
    value: [[255, 69, 0, 255], [255, 140, 0, 255], [255, 215, 0, 255]], 
    preview: 'linear-gradient(90deg, #FF4500 0%, #FF8C00 50%, #FFD700 100%)' 
  },
  { 
    name: 'Candy Cane', 
    value: [[220, 20, 60, 255], [255, 255, 255, 255]], 
    preview: 'linear-gradient(90deg, #DC143C 0%, #FFFFFF 100%)' 
  },
  { 
    name: 'Frosty White', 
    value: [[255, 248, 220, 255], [240, 248, 255, 255], [176, 224, 230, 255]], 
    preview: 'linear-gradient(90deg, #FFF8DC 0%, #F0F8FF 50%, #B0E0E6 100%)' 
  },
  { 
    name: 'Purple & Gold', 
    value: [[75, 0, 130, 255], [255, 215, 0, 255]], 
    preview: 'linear-gradient(90deg, #4B0082 0%, #FFD700 100%)' 
  },
  { 
    name: 'Ocean Waves', 
    value: [[0, 0, 255, 255], [0, 128, 128, 255], [64, 224, 208, 255]], 
    preview: 'linear-gradient(90deg, #0000FF 0%, #008080 50%, #40E0D0 100%)' 
  }
]

export interface ColorDropdownProps {
  readonly value: number[][];
  readonly onChange: (color: number[][]) => void;
  readonly disabled?: boolean;
}

const ColorDropdown = ({ value, onChange, disabled = false }: ColorDropdownProps) => {
  const selectedColor = CHRISTMAS_COLORS.find(color => 
    color.value.length === value.length && 
    color.value.every((rgba, index) => 
      rgba.every((component, compIndex) => component === value[index][compIndex])
    )
  ) || CHRISTMAS_COLORS[0]

  return (
    <div className={styles.dropdownContainer}>
      <select
        value={CHRISTMAS_COLORS.findIndex(color => 
          color.value.length === value.length && 
          color.value.every((rgba, index) => 
            rgba.every((component, compIndex) => component === value[index][compIndex])
          )
        )}
        onChange={(e) => onChange(CHRISTMAS_COLORS[parseInt(e.target.value)].value)}
        disabled={disabled}
        className={styles.dropdown}
      >
        {CHRISTMAS_COLORS.map((color, index) => (
          <option key={index} value={index}>
            {color.name}
          </option>
        ))}
      </select>
      <div 
        className={styles.colorPreview}
        style={{ 
          background: selectedColor.preview,
          backgroundSize: 'cover'
        }}
      />
    </div>
  )
}

export default ColorDropdown
