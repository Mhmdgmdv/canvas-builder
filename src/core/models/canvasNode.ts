export type CanvasNodeType =
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

export type CanvasNodeProps = {
  text: string
}

export type CanvasNodeStyles = {
  classes: string
}

export type CanvasNodeLayout = {
  display?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-flex'
  position?: 'flow' | 'absolute'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justifyContent?:
    | 'start'
    | 'center'
    | 'end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  gap?: number | string
  width?: number | string
  height?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  minHeight?: number | string
  maxHeight?: number | string
  gridTemplateColumns?: string
  gridTemplateRows?: string
  margin?: number | string
  padding?: number | string
}

export type CanvasNodeEditor = {
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  scale?: number
}

export type CanvasNode = {
  id: string
  name: string
  type: CanvasNodeType
  props: CanvasNodeProps
  styles: CanvasNodeStyles
  layout: CanvasNodeLayout
  editor: CanvasNodeEditor
  children: CanvasNode[]
}

export type CanvasComponentType = CanvasNodeType

export type CanvasPage = {
  id: string
  name: string
  nodes: CanvasNode[]
}

export type CanvasSize = {
  width: number
  height: number
}

export const CANVAS_COMPONENTS: Record<
  CanvasComponentType,
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
) as CanvasComponentType[]

export const CANVAS_NODE_LABELS: Record<CanvasNodeType, string> = {
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
