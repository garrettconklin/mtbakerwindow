# Mt Baker Window - Christmas Light Planner

A React + TypeScript application for planning Christmas light displays on house images.

## Features

- Upload house images
- Draw light strands with draggable control points
- Create mesh light areas (blanket lights)
- Real-time light rendering with customizable colors and density
- Properties panel for adjusting light settings
- Clean, invisible control points that appear on hover

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## GitHub Pages Deployment

This repository is configured for automatic deployment to GitHub Pages:

1. **Repository Settings**: Go to Settings → Pages
2. **Source**: Select "GitHub Actions" (not "Deploy from a branch")
3. **Automatic Deployment**: Every push to `main` branch will automatically build and deploy

The app will be available at: `https://[username].github.io/mtbakerwindow/`

## Technology Stack

- **React 18** with TypeScript
- **Vite** for bundling and development
- **CSS Modules** for styling
- **HTML5 Canvas** for light rendering
- **GitHub Actions** for CI/CD

## Usage

1. Upload an image of your house
2. Click and drag to create light strands
3. Draw closed loops to create mesh light areas
4. Use the properties panel to adjust light colors and density
5. Press DELETE to remove selected points
6. Press ESC to deselect points