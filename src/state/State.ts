export type Point = { x: number; y: number; }
export type PointIndex = number;
export type Line = { a: PointIndex; b: PointIndex; }
export type DragMode = 'strand' | 'mesh' | null

/**
 * Application state shape
 */
export type State = {  
  /**
   * The uploaded house image as a blob URL string.
   * Created via URL.createObjectURL() from the uploaded File object.
   * Format: "blob:http://localhost:5173/[uuid]"
   * 
   * Example: "blob:http://localhost:5173/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   * 
   * Note: Blob URLs are memory-efficient references to the File object.
   * We're not calling URL.revokeObjectURL() since the page lifecycle is short
   * and users won't be uploading many images. The browser will clean up when
   * the page unloads.
   * 
   * null when no image has been uploaded yet.
   */
  readonly image: string | null;

  // line lights with strands.
  readonly points: Point[];
  readonly lines: Line[];
  readonly draggingPointIndex: PointIndex | null;
  /**
   * When creating a new strand, this is the index of the first point.
   * The draggingPointIndex will be the second point being dragged.
   * null when not creating a strand.
   */
  readonly creatingStrandFromIndex: PointIndex | null;
  /**
   * The currently selected point index (for deletion, etc).
   * Updated when clicking on a point.
   */
  readonly selectedPointIndex: PointIndex | null;
  /**
   * Number from 0-1 which controls the density of lights on each strand.
   */
  readonly lineLightDensity: number;

            readonly lineLightColor: number[][];
            readonly meshLightColor: number[][];
  /**
   * Number from 0-1 which controls the density of lights within each mesh.
   */
  readonly meshLightDensity: number;

  // mesh lights. Each mesh is a list of points that forms a closed loop.
  readonly meshes: Point[][];

  // Gesture tracking for visual feedback
  readonly dragPath: Point[];
  readonly dragMode: DragMode;
};

/**
 * Initial application state
 */
export const DEFAULT_STATE: State = {
  image: null,
  points: [],
  lines: [],
  draggingPointIndex: null,
  creatingStrandFromIndex: null,
  selectedPointIndex: null,
            lineLightDensity: 0.6,
            lineLightColor: [[255, 215, 0, 255]], // Golden Yellow
            meshLightColor: [[255, 215, 0, 255]], // Golden Yellow
            meshLightDensity: 0.4,
  meshes: [
    // Sample mesh for testing - a simple triangle
    [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 150, y: 200 }
    ]
  ],
  dragPath: [],
  dragMode: null,
}

