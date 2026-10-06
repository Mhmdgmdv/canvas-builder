import {
  CANVAS_COMPONENTS,
  type CanvasElementNode,
  type CanvasElementType,
  type CanvasItem,
  type CanvasItemType,
  type CanvasPage,
  type CanvasSize,
} from '../models/canvasItem'

const elementDefaults: Record<
  CanvasElementType,
  { text: string; classes: string }
> = {
  container: {
    text: '',
    classes: 'flex flex-col gap-2 p-4 bg-slate-50 rounded-lg',
  },
  text: {
    text: 'Edit this text',
    classes: 'text-base text-slate-700',
  },
  button: {
    text: 'Button label',
    classes: 'px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg',
  },
  icon: {
    text: '✦',
    classes: 'text-xl text-indigo-700',
  },
  image: {
    text: 'Image placeholder',
    classes: 'flex items-center justify-center w-full min-h-24 bg-slate-100 text-slate-600 rounded-lg',
  },
  input: {
    text: 'Your name',
    classes: 'w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-slate-700',
  },
  divider: {
    text: '',
    classes: 'w-full border border-slate-200',
  },
  header: {
    text: '',
    classes: 'flex flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm',
  },
  hero: {
    text: '',
    classes: 'flex flex-col justify-center gap-3 p-6 bg-blue-50 rounded-2xl border border-blue-300',
  },
  card: {
    text: '',
    classes: 'flex flex-row items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm',
  },
  section: {
    text: '',
    classes: 'flex flex-col gap-3 p-6 bg-slate-50 rounded-2xl',
  },
}

export class CanvasItemFactory {
  private nextId = 1

  reserveIds(pages: CanvasPage[]): void {
    const findMaxId = (nodes: CanvasElementNode[]): number =>
      nodes.reduce(
        (maxId, node) => Math.max(maxId, node.id, findMaxId(node.children)),
        0,
      )
    const maxId = pages.reduce(
      (pageMax, page) =>
        Math.max(
          pageMax,
          ...page.items.map((item) =>
            Math.max(item.id, findMaxId(item.children)),
          ),
        ),
      0,
    )

    this.nextId = Math.max(this.nextId, maxId + 1)
  }

  create(type: CanvasItemType, itemCount: number, canvas: CanvasSize): CanvasItem {
    const component = CANVAS_COMPONENTS[type]
    const width = Math.min(component.width, Math.max(200, canvas.width - 32))
    const maxX = Math.max(16, canvas.width - width - 16)
    const maxY = Math.max(16, canvas.height - component.height - 16)
    const itemId = this.nextId
    this.nextId += 1
    const item: CanvasItem = {
      id: itemId,
      type,
      x: Math.min(24 + (itemCount % 3) * 52, maxX),
      y: Math.min(24 + (itemCount % 4) * 44, maxY),
      width,
      height: component.height,
      rotation: 0,
      classes: this.getRootClasses(type),
      children: this.createDefaultChildren(type),
    }

    return item
  }

  createElement(type: CanvasElementType): CanvasElementNode {
    const defaults = elementDefaults[type]
    if (type === 'header' || type === 'hero' || type === 'card' || type === 'section') {
      return this.node(
        type,
        '',
        this.getRootClasses(type),
        this.createDefaultChildren(type),
      )
    }

    if (type === 'button') {
      return this.button(defaults.text, defaults.classes)
    }

    return {
      id: this.nextId++,
      type,
      text: defaults.text,
      classes: defaults.classes,
      children: [],
    }
  }

  private createDefaultChildren(type: CanvasItemType): CanvasElementNode[] {
    switch (type) {
      case 'header':
        return [
          this.node('text', 'Northstar', 'text-lg font-bold text-slate-900'),
          this.node('container', '', 'flex flex-row items-center gap-4', [
            this.node('text', 'Home', 'text-sm text-slate-600'),
            this.node('text', 'Features', 'text-sm text-slate-600'),
            this.node('text', 'Pricing', 'text-sm text-slate-600'),
          ]),
          this.node(
            'button',
            '',
            'px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg',
            [this.node('text', 'Launch', 'text-sm font-semibold text-white')],
          ),
        ]
      case 'hero':
        return [
          this.node('text', 'Product launch', 'text-xs font-bold text-indigo-700'),
          this.node(
            'text',
            'Build a brand people remember.',
            'text-3xl font-bold text-slate-900',
          ),
          this.node(
            'text',
            'Turn ideas into polished user experiences.',
            'text-base text-slate-600',
          ),
          this.node('container', '', 'flex flex-row items-center gap-2', [
            this.button(
              'Get started',
              'px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg',
            ),
            this.button(
              'View demo',
              'px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200',
            ),
          ]),
        ]
      case 'text':
        return [
          this.node('text', 'Section title', 'text-xl font-semibold text-slate-900'),
          this.node(
            'text',
            'Describe your value clearly and keep the message easy to scan.',
            'text-base text-slate-600',
          ),
        ]
      case 'button':
        return [
          this.button(
            'Primary action',
            'px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg',
          ),
        ]
      case 'card':
        return [
          this.node('icon', '↗', 'flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-700 rounded-lg'),
          this.node('container', '', 'flex flex-col gap-1', [
            this.node('text', 'Revenue', 'text-xs font-semibold text-slate-600'),
            this.node('text', '$38.4K', 'text-2xl font-bold text-slate-900'),
            this.node('text', '+24% this month', 'text-sm text-blue-700'),
          ]),
        ]
      case 'container':
        return [this.node('text', 'Add content to this container', 'text-base text-slate-600')]
      case 'section':
        return [
          this.node('text', 'Section heading', 'text-2xl font-bold text-slate-900'),
          this.node('text', 'Add a description for this section.', 'text-base text-slate-600'),
        ]
      case 'input':
        return [this.node('input', 'Your name', elementDefaults.input.classes)]
      case 'image':
        return [this.node('image', 'Image placeholder', elementDefaults.image.classes)]
      case 'icon':
        return [this.node('icon', '✦', elementDefaults.icon.classes)]
      case 'divider':
        return [this.node('divider', '', elementDefaults.divider.classes)]
    }
  }

  private getRootClasses(type: CanvasItemType): string {
    switch (type) {
      case 'header':
        return 'flex flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm'
      case 'hero':
        return 'flex flex-col justify-center gap-3 p-6 bg-blue-50 rounded-2xl border border-blue-300'
      case 'text':
        return 'flex flex-col gap-2 p-4 bg-white rounded-xl border border-slate-200'
      case 'button':
        return 'flex items-center justify-center p-2 bg-white rounded-xl'
      case 'card':
        return 'flex flex-row items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm'
      case 'container':
        return 'flex flex-col gap-2 p-4 bg-white rounded-xl border border-slate-200'
      case 'section':
        return 'flex flex-col gap-3 p-6 bg-slate-50 rounded-2xl'
      case 'input':
        return 'flex items-center p-2 bg-white rounded-xl'
      case 'image':
        return 'flex items-stretch p-2 bg-white rounded-xl'
      case 'icon':
        return 'flex items-center justify-center text-xl text-indigo-700'
      case 'divider':
        return 'flex items-center w-full'
    }
  }

  private node(
    type: CanvasElementType,
    text: string,
    classes: string,
    children: CanvasElementNode[] = [],
  ): CanvasElementNode {
    return {
      id: this.nextId++,
      type,
      text,
      classes,
      children,
    }
  }

  private button(text: string, classes: string): CanvasElementNode {
    return this.node('button', '', classes, [
      this.node('text', text, 'text-sm font-semibold'),
    ])
  }
}
