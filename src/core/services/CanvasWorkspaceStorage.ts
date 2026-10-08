import {
  CANVAS_COMPONENT_TYPES,
  CANVAS_NODE_LABELS,
  type CanvasNode,
  type CanvasNodeLayout,
  type CanvasPage,
} from '../models/canvasNode'

export type CanvasWorkspaceSnapshot = {
  pages: CanvasPage[]
  activePageId: string
}

const STORAGE_KEY = 'canvas-builder.workspace.v3'
const PREVIOUS_STORAGE_KEY = 'canvas-builder.workspace.v2'
const LEGACY_STORAGE_KEY = 'canvas-builder.workspace.v1'

function createInitialPage(): CanvasPage {
  return {
    id: crypto.randomUUID(),
    name: 'Landing page',
    nodes: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCanvasNodeType(value: unknown): value is CanvasNode['type'] {
  return (
    typeof value === 'string' &&
    CANVAS_COMPONENT_TYPES.some((type) => type === value)
  )
}

function isOptionalFiniteNumber(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return value[key] === undefined ||
    (typeof value[key] === 'number' && Number.isFinite(value[key]))
}

function isOneOf(value: unknown, options: readonly string[]): boolean {
  return value === undefined ||
    (typeof value === 'string' && options.some((option) => option === value))
}

function isOptionalCssLength(value: unknown): boolean {
  return value === undefined ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'string'
}

function isCanvasNodeLayout(value: Record<string, unknown>): boolean {
  return (
    isOneOf(value.position, ['flow', 'absolute']) &&
    isOneOf(value.display, ['block', 'flex', 'grid', 'inline', 'inline-flex']) &&
    isOneOf(value.flexDirection, ['row', 'column', 'row-reverse', 'column-reverse']) &&
    isOneOf(value.flexWrap, ['nowrap', 'wrap', 'wrap-reverse']) &&
    isOneOf(value.alignItems, ['start', 'center', 'end', 'stretch', 'baseline']) &&
    isOneOf(value.justifyContent, [
      'start',
      'center',
      'end',
      'space-between',
      'space-around',
      'space-evenly',
    ]) &&
    ['gap', 'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'margin', 'padding']
      .every((key) => isOptionalCssLength(value[key])) &&
    ['gridTemplateColumns', 'gridTemplateRows'].every(
      (key) => value[key] === undefined || typeof value[key] === 'string',
    )
  )
}

function isCanvasNode(value: unknown): value is CanvasNode {
  if (!isRecord(value)) return false
  const { props, styles, layout, editor, children } = value
  return (
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isCanvasNodeType(value.type) &&
    isRecord(props) &&
    typeof props.text === 'string' &&
    isRecord(styles) &&
    typeof styles.classes === 'string' &&
    isRecord(layout) &&
    isCanvasNodeLayout(layout) &&
    isRecord(editor) &&
    ['x', 'y', 'width', 'height', 'rotation', 'scale'].every((key) =>
      isOptionalFiniteNumber(editor, key),
    ) &&
    Array.isArray(children) &&
    children.every(isCanvasNode)
  )
}

function optionalNumber(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function migrateCurrentNode(value: unknown): CanvasNode | null {
  if (
    !isRecord(value) ||
    !isRecord(value.editor) ||
    !isCanvasNodeType(value.type) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0
  ) {
    return null
  }
  const children = Array.isArray(value.children)
    ? value.children.map(migrateCurrentNode)
    : null
  if (!children || children.some((child) => child === null)) return null

  const candidate = {
    ...value,
    name:
      typeof value.name === 'string' && value.name.trim()
        ? value.name
        : `${CANVAS_NODE_LABELS[value.type]} ${value.id}`,
    editor: {
      ...value.editor,
      scale: optionalNumber(value.editor, 'scale'),
    },
    children: children.filter((child): child is CanvasNode => child !== null),
  }
  return isCanvasNode(candidate) ? candidate : null
}

function migratePreviousNode(value: unknown): CanvasNode | null {
  if (
    !isRecord(value) ||
    !isRecord(value.props) ||
    !isRecord(value.styles) ||
    !isRecord(value.layout) ||
    !isRecord(value.editor) ||
    !Array.isArray(value.children) ||
    typeof value.type !== 'string' ||
    !isCanvasNodeType(value.type) ||
    typeof value.props.text !== 'string' ||
    typeof value.styles.classes !== 'string' ||
    (typeof value.id !== 'number' &&
      (typeof value.id !== 'string' || value.id.trim().length === 0))
  ) {
    return null
  }

  const children = value.children.map(migratePreviousNode)
  if (children.some((child) => child === null)) return null
  const id =
    typeof value.id === 'number'
      ? `${value.type}-${value.id}`
      : value.id

  return {
    id,
    name:
      typeof value.name === 'string' && value.name.trim()
        ? value.name
        : `${CANVAS_NODE_LABELS[value.type]} ${id}`,
    type: value.type,
    props: { text: value.props.text },
    styles: { classes: value.styles.classes },
    layout: value.layout as CanvasNodeLayout,
    editor: {
      x: optionalNumber(value.editor, 'x'),
      y: optionalNumber(value.editor, 'y'),
      width: optionalNumber(value.editor, 'width'),
      height: optionalNumber(value.editor, 'height'),
      rotation: optionalNumber(value.editor, 'rotation'),
      scale: optionalNumber(value.editor, 'scale'),
    },
    children: children.filter((child): child is CanvasNode => child !== null),
  }
}

function migrateLegacyNode(value: unknown, isRoot: boolean): CanvasNode | null {
  if (!isRecord(value) || !Array.isArray(value.children)) return null
  const text = typeof value.text === 'string' ? value.text : isRoot ? '' : null
  if (
    (typeof value.id !== 'number' || !Number.isFinite(value.id)) ||
    !isCanvasNodeType(value.type) ||
    text === null ||
    typeof value.classes !== 'string'
  ) {
    return null
  }

  const children = value.children.map((child) => migrateLegacyNode(child, false))
  if (children.some((child) => child === null)) return null

  const layout: CanvasNodeLayout = { position: isRoot ? 'absolute' : 'flow' }
  const editor = {
    x: optionalNumber(value, 'x'),
    y: optionalNumber(value, 'y'),
    width: optionalNumber(value, 'width'),
    height: optionalNumber(value, 'height'),
    rotation: optionalNumber(value, 'rotation'),
    scale: optionalNumber(value, 'scale'),
  }

  return {
    id: `${value.type}-${value.id}`,
    name: `${CANVAS_NODE_LABELS[value.type]} ${value.id}`,
    type: value.type,
    props: { text },
    styles: { classes: value.classes },
    layout,
    editor,
    children: children.filter((child): child is CanvasNode => child !== null),
  }
}

function migrateLegacyWorkspace(value: unknown): CanvasWorkspaceSnapshot | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.pages) ||
    value.pages.length === 0 ||
    typeof value.activePageId !== 'string'
  ) {
    return null
  }

  const pages: CanvasPage[] = []
  for (const page of value.pages) {
    if (
      !isRecord(page) ||
      typeof page.id !== 'string' ||
      typeof page.name !== 'string' ||
      !Array.isArray(page.items)
    ) {
      return null
    }
    const nodes = page.items.map((item) => migrateLegacyNode(item, true))
    if (nodes.some((node) => node === null)) return null
    pages.push({
      id: page.id,
      name: page.name,
      nodes: nodes.filter((node): node is CanvasNode => node !== null),
    })
  }

  const activePageId = pages.some((page) => page.id === value.activePageId)
    ? value.activePageId
    : pages[0].id
  return { pages, activePageId }
}

export class CanvasWorkspaceStorage {
  load(): CanvasWorkspaceSnapshot {
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY)
      if (storedValue) {
        const parsed: unknown = JSON.parse(storedValue)
        if (
          isRecord(parsed) &&
          Array.isArray(parsed.pages) &&
          parsed.pages.length > 0 &&
          typeof parsed.activePageId === 'string'
        ) {
          const pages: CanvasPage[] = []
          for (const page of parsed.pages) {
            if (
              !isRecord(page) ||
              typeof page.id !== 'string' ||
              typeof page.name !== 'string' ||
              !Array.isArray(page.nodes)
            ) {
              console.error('Saved Canvas Builder workspace has an invalid format.')
              return createWorkspace()
            }
            const nodes = page.nodes.map(migrateCurrentNode)
            if (nodes.some((node) => node === null)) {
              console.error('Saved Canvas Builder workspace has an invalid format.')
              return createWorkspace()
            }
            pages.push({
              id: page.id,
              name: page.name,
              nodes: nodes.filter((node): node is CanvasNode => node !== null),
            })
          }
          const activePageId = pages.some(
            (page) => page.id === parsed.activePageId,
          )
            ? parsed.activePageId
            : pages[0].id
          return { pages, activePageId }
        }
        console.error('Saved Canvas Builder workspace has an invalid format.')
      }

      const previousValue = localStorage.getItem(PREVIOUS_STORAGE_KEY)
      if (previousValue) {
        const parsed: unknown = JSON.parse(previousValue)
        if (
          isRecord(parsed) &&
          Array.isArray(parsed.pages) &&
          parsed.pages.length > 0 &&
          typeof parsed.activePageId === 'string'
        ) {
          const pages: CanvasPage[] = []
          for (const page of parsed.pages) {
            if (
              !isRecord(page) ||
              typeof page.id !== 'string' ||
              typeof page.name !== 'string' ||
              !Array.isArray(page.nodes)
            ) {
              console.error('Saved Canvas Builder workspace has an invalid format.')
              return createWorkspace()
            }
            const nodes = page.nodes.map(migratePreviousNode)
            if (nodes.some((node) => node === null)) {
              console.error('Saved Canvas Builder workspace could not be migrated.')
              return createWorkspace()
            }
            pages.push({
              id: page.id,
              name: page.name,
              nodes: nodes.filter((node): node is CanvasNode => node !== null),
            })
          }
          const activePageId = pages.some(
            (page) => page.id === parsed.activePageId,
          )
            ? parsed.activePageId
            : pages[0].id
          return { pages, activePageId }
        }
        console.error('Saved Canvas Builder workspace has an invalid format.')
        return createWorkspace()
      }

      const legacyValue = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacyValue) {
        const migrated = migrateLegacyWorkspace(JSON.parse(legacyValue))
        if (migrated) return migrated
        console.error('Saved legacy Canvas Builder workspace could not be migrated.')
      }
    } catch (error) {
      console.error('Unable to load the saved Canvas Builder workspace.', error)
    }

    return createWorkspace()
  }

  save(snapshot: CanvasWorkspaceSnapshot): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    } catch (error) {
      console.error('Unable to save the Canvas Builder workspace.', error)
    }
  }
}

function createWorkspace(): CanvasWorkspaceSnapshot {
    const page = createInitialPage()
    return { pages: [page], activePageId: page.id }
}
