import type { CanvasNode, CanvasPage } from '../models/canvasNode'
import { getCanvasPageSize } from './CanvasPageLayout'
import { ZipArchive } from './ZipArchive'

type ExportPage = {
  page: CanvasPage
  componentName: string
  fileName: string
}

function quote(value: string): string {
  return JSON.stringify(value)
}

function getPageExtent(nodes: CanvasNode[]): { width: number; height: number } {
  return getCanvasPageSize(nodes, 960)
}

function getComponentFileName(name: string, index: number): string {
  const baseName = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('')

  return `Page${index + 1}${baseName || 'Canvas'}`
}

function generateCanvasNodeComponent(): string {
  return `import type { CanvasNode as CanvasNodeData } from './canvasTypes'
import type { CSSProperties, ReactNode } from 'react'

type CanvasNodeProps = {
  node: CanvasNodeData
}

export function CanvasNode({ node }: CanvasNodeProps) {
  const children = node.children.map((child) => <CanvasNode key={child.id} node={child} />)
  let content: ReactNode
  const layoutStyle: CSSProperties = {
    display: node.layout.display,
    flexDirection: node.layout.flexDirection,
    flexWrap: node.layout.flexWrap,
    alignItems: node.layout.alignItems,
    justifyContent: node.layout.justifyContent,
    gap: node.layout.gap,
    width: node.layout.width,
    height: node.layout.height,
    minWidth: node.layout.minWidth,
    maxWidth: node.layout.maxWidth,
    minHeight: node.layout.minHeight,
    maxHeight: node.layout.maxHeight,
    gridTemplateColumns: node.layout.gridTemplateColumns,
    gridTemplateRows: node.layout.gridTemplateRows,
    margin: node.layout.margin,
    padding: node.layout.padding,
  }

  switch (node.type) {
    case 'container':
      content = <div className={node.styles.classes} style={layoutStyle}>{children}</div>
      break
    case 'header':
      content = <header className={node.styles.classes} style={layoutStyle}>{children}</header>
      break
    case 'hero':
    case 'section':
      content = <section className={node.styles.classes} style={layoutStyle}>{children}</section>
      break
    case 'card':
      content = <article className={node.styles.classes} style={layoutStyle}>{children}</article>
      break
    case 'text':
      content = <><p className={node.styles.classes} style={layoutStyle}>{node.props.text}</p>{children}</>
      break
    case 'button':
      content = <button type="button" className={node.styles.classes} style={layoutStyle}>{node.props.text}{children}</button>
      break
    case 'icon':
      content = <><span aria-hidden="true" className={node.styles.classes} style={layoutStyle}>{node.props.text}</span>{children}</>
      break
    case 'image':
      content = <><div role="img" aria-label={node.props.text} className={node.styles.classes} style={layoutStyle}>{node.props.text}</div>{children}</>
      break
    case 'input':
      content = <><input type="text" placeholder={node.props.text} aria-label={node.props.text} className={node.styles.classes} style={layoutStyle} readOnly />{children}</>
      break
    case 'divider':
      content = <><hr className={node.styles.classes} style={layoutStyle} />{children}</>
      break
  }

  return (
    <div
      style={{
        position: node.layout.position === 'absolute' ? 'absolute' : node.editor.x !== undefined || node.editor.y !== undefined ? 'relative' : undefined,
        left: node.editor.x,
        top: node.editor.y,
        width: node.editor.width,
        height: node.editor.height,
        transform: node.editor.rotation ? \`rotate(\${node.editor.rotation}deg)\` : undefined,
        transformOrigin: 'center center',
      }}
    >
      {content}
    </div>
  )
}
`
}

function generatePageComponent(page: CanvasPage, componentName: string): string {
  const nodes = JSON.stringify(page.nodes, null, 2)
  const extent = getPageExtent(page.nodes)

  return `import { CanvasNode as CanvasNodeView } from '../components/CanvasNode'
import type { CanvasNode as CanvasNodeData } from '../components/canvasTypes'

const nodes: CanvasNodeData[] = ${nodes}

export default function ${componentName}() {
  return (
    <main
      className="relative min-h-screen bg-slate-50"
      style={{ width: 'max(100%, ${extent.width}px)', minHeight: '${extent.height}px' }}
    >
      {nodes.map((node) => (
        <div
          key={node.id}
          className="absolute"
          style={{
            left: node.editor.x,
            top: node.editor.y,
            width: node.editor.width,
            height: node.editor.height,
            transform: \`rotate(\${node.editor.rotation ?? 0}deg)\`,
            transformOrigin: 'center center',
          }}
        >
          <div
            className={node.styles.classes}
            style={{
              width: node.layout.width ?? '100%',
              height: node.layout.height ?? '100%',
              display: node.layout.display,
              flexDirection: node.layout.flexDirection,
              flexWrap: node.layout.flexWrap,
              alignItems: node.layout.alignItems,
              justifyContent: node.layout.justifyContent,
              gap: node.layout.gap,
              minWidth: node.layout.minWidth,
              maxWidth: node.layout.maxWidth,
              minHeight: node.layout.minHeight,
              maxHeight: node.layout.maxHeight,
              gridTemplateColumns: node.layout.gridTemplateColumns,
              gridTemplateRows: node.layout.gridTemplateRows,
              margin: node.layout.margin,
              padding: node.layout.padding,
            }}
          >
            {node.children.map((child) => (
              <CanvasNodeView key={child.id} node={child} />
            ))}
          </div>
        </div>
      ))}
    </main>
  )
}
`
}

function generateApp(pages: ExportPage[]): string {
  const imports = pages
    .map(
      (page) =>
        `import ${page.componentName} from './pages/${page.fileName}'`,
    )
    .join('\n')
  const pageEntries = pages
    .map(
      (page) =>
        `  { id: ${quote(page.page.id)}, name: ${quote(page.page.name)}, Page: ${page.componentName} },`,
    )
    .join('\n')

  return `import { useState } from 'react'
${imports}

const pages = [
${pageEntries}
]

export default function App() {
  const [activePageId, setActivePageId] = useState(pages[0]?.id)
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0]
  const ActivePage = activePage?.Page

  return (
    <div>
      <nav className="flex gap-2 border-b border-slate-200 bg-white p-3">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            className={page.id === activePageId ? 'rounded bg-indigo-600 px-3 py-2 text-white' : 'rounded bg-slate-100 px-3 py-2 text-slate-700'}
            onClick={() => setActivePageId(page.id)}
          >
            {page.name}
          </button>
        ))}
      </nav>
      {ActivePage && <ActivePage />}
    </div>
  )
}
`
}

export class ReactProjectExporter {
  export(pages: CanvasPage[]): Blob {
    if (pages.length === 0) {
      throw new Error('Cannot export a React project without any pages.')
    }

    const usedFileNames = new Set<string>()
    const exportPages = pages.map((page, index) => {
      const baseFileName = getComponentFileName(page.name, index)
      let fileName = baseFileName
      let suffix = 2
      while (usedFileNames.has(fileName.toLowerCase())) {
        fileName = `${baseFileName}${suffix}`
        suffix += 1
      }
      usedFileNames.add(fileName.toLowerCase())
      return { page, fileName: `${fileName}.tsx`, componentName: fileName }
    })

    const archive = new ZipArchive()
    archive.addFile('package.json', JSON.stringify({
      name: 'canvas-builder-export',
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'tsc -b && vite build', preview: 'vite preview' },
      dependencies: { react: '^19.2.8', 'react-dom': '^19.2.8' },
      devDependencies: {
        '@types/react': '^19.2.18',
        '@types/react-dom': '^19.2.7',
        '@vitejs/plugin-react': '^6.1.1',
        autoprefixer: '^10.6.1',
        postcss: '^8.5.6',
        tailwindcss: '^3.4.17',
        typescript: '~6.0.2',
        vite: '^8.3.0',
      },
    }, null, 2))
    archive.addFile('index.html', '<!doctype html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Canvas Export</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>')
    archive.addFile('postcss.config.cjs', "module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }\n")
    archive.addFile('tailwind.config.cjs', "module.exports = { content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'], theme: { extend: {} }, plugins: [] }\n")
    archive.addFile('tsconfig.json', JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        useDefineForClassFields: true,
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        moduleDetection: 'force',
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
      },
      include: ['src'],
    }, null, 2))
    archive.addFile('src/main.tsx', "import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\ncreateRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)\n")
    archive.addFile('src/vite-env.d.ts', '/// <reference types="vite/client" />\n')
    archive.addFile('src/index.css', '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml, body, #root { min-height: 100%; margin: 0; }\nbody { min-width: 320px; font-family: system-ui, sans-serif; }\n')
    archive.addFile('src/components/canvasTypes.ts', `export type CanvasNodeType = 'container' | 'header' | 'hero' | 'section' | 'card' | 'text' | 'button' | 'icon' | 'image' | 'input' | 'divider'

export type CanvasNodeLayout = {
  display?: 'block' | 'flex' | 'grid' | 'inline' | 'inline-flex'
  position?: 'flow' | 'absolute'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
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

export type CanvasNode = {
  id: number
  type: CanvasNodeType
  props: { text: string }
  styles: { classes: string }
  layout: CanvasNodeLayout
  editor: { x?: number; y?: number; width?: number; height?: number; rotation?: number }
  children: CanvasNode[]
}
`)
    archive.addFile('src/components/CanvasNode.tsx', generateCanvasNodeComponent())
    for (const page of exportPages) {
      archive.addFile(
        `src/pages/${page.fileName}`,
        generatePageComponent(page.page, page.componentName),
      )
    }
    archive.addFile('src/App.tsx', generateApp(exportPages))
    archive.addFile('README.md', '# Canvas Builder export\n\nThis React project was generated from your canvas pages.\n\n```sh\nnpm install\nnpm run dev\n```\n\nGenerated page components are in `src/pages/`; shared rendering components are in `src/components/`.\n')

    return archive.toBlob()
  }
}
