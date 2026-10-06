export type CanvasItemType =
  | 'header'
  | 'hero'
  | 'text'
  | 'button'
  | 'card'
  | 'container'
  | 'section'
  | 'input'
  | 'image'
  | 'icon'
  | 'divider'

export type CanvasElementType = CanvasItemType

export type CanvasElementNode = {
  id: number
  type: CanvasElementType
  text: string
  classes: string
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  children: CanvasElementNode[]
}

export type CanvasItem = {
  id: number
  type: CanvasItemType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  classes: string
  children: CanvasElementNode[]
}

export type CanvasPage = {
  id: string
  name: string
  items: CanvasItem[]
}

export type CanvasSize = {
  width: number
  height: number
}

export const CANVAS_COMPONENTS: Record<
  CanvasItemType,
  { label: string; width: number; height: number; description: string }
> = {
  header: {
    label: 'Header',
    width: 560,
    height: 78,
    description: 'Brand + nav links',
  },
  hero: {
    label: 'Hero card',
    width: 520,
    height: 156,
    description: 'Title, copy, actions',
  },
  text: {
    label: 'Text block',
    width: 320,
    height: 110,
    description: 'Paragraph and labels',
  },
  button: {
    label: 'Button',
    width: 180,
    height: 62,
    description: 'Primary CTA',
  },
  card: {
    label: 'Info card',
    width: 260,
    height: 120,
    description: 'Dashboard stats',
  },
  container: {
    label: 'Container (div)',
    width: 360,
    height: 160,
    description: 'Flexible content wrapper',
  },
  section: {
    label: 'Section',
    width: 420,
    height: 180,
    description: 'Page content section',
  },
  input: {
    label: 'Input',
    width: 260,
    height: 64,
    description: 'Form field',
  },
  image: {
    label: 'Image',
    width: 260,
    height: 150,
    description: 'Image placeholder',
  },
  icon: {
    label: 'Icon',
    width: 80,
    height: 80,
    description: 'Decorative icon',
  },
  divider: {
    label: 'Divider',
    width: 320,
    height: 24,
    description: 'Horizontal divider',
  },
}

export const CANVAS_COMPONENT_TYPES = Object.keys(
  CANVAS_COMPONENTS,
) as CanvasItemType[]

export const CANVAS_ELEMENT_LABELS: Record<CanvasElementType, string> = {
  container: 'Container',
  text: 'Text block',
  button: 'Button',
  icon: 'Icon',
  image: 'Image',
  input: 'Input',
  divider: 'Divider',
  header: 'Header',
  hero: 'Hero card',
  card: 'Info card',
  section: 'Section',
}

export const CANVAS_ELEMENT_TYPES = Object.keys(
  CANVAS_ELEMENT_LABELS,
) as CanvasElementType[]
