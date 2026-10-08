Canvas Builder

Canvas Builder is an open-source visual UI builder for React that lets developers design web interfaces visually and export them as real, maintainable React projects.

Instead of treating a design as a collection of pixels, Canvas Builder represents the interface as a structured, editable component tree. This makes the visual editor, preview, and generated code part of the same underlying system.

✨ Vision

The goal is to bridge the gap between visual design and real frontend development.

Visual Design
      ↓
Structured UI Tree
      ↓
React Code
      ↓
Real Project

Canvas Builder is designed to produce code that developers can continue working with after export—not a static image or an opaque generated representation.

🚀 Current Features

- Visual canvas-based UI editing
- Hierarchical component tree
- Nested components
- Component selection and inspection
- Editable text and styles
- Component duplication and deletion
- Multiple pages
- Local project persistence
- Scene/object tree
- Component factories for predefined UI structures
- React project export
- TypeScript + React + Vite based architecture

🏗️ Architecture

Canvas Builder is built around a structured document model rather than storing the UI as raw canvas coordinates.

A page contains one recursive tree of nodes. Page-level objects and nested elements use the same node shape:

Page
├── Navbar
├── Hero
│   ├── Heading
│   ├── Description
│   └── Actions
│       ├── Button
│       └── Button
├── Features
│   ├── Card
│   ├── Card
│   └── Card
└── Footer

Every node separates web content from canvas-only editing state:

```ts
type CanvasNode = {
  id: string
  name: string
  type: ComponentType
  props: NodeProps
  styles: NodeStyles
  layout: NodeLayout
  editor: EditorMetadata
  children: CanvasNode[]
}
```

- `props` contains semantic component data such as text.
- `name` is the human-readable label shown in the scene tree; `id` is the unique, editable HTML ID used to identify the node.
- `styles` contains visual styling such as Tailwind classes.
- `layout` is the structured home for CSS layout rules (flow/absolute positioning, flex, grid, spacing, and size constraints) as first-class layout controls are added.
- `editor` contains canvas coordinates, editor dimensions, and rotation; it does not define the document tree or component properties.
- `children` expresses structural ownership: a parent owns and arranges its child nodes through its layout.

The current Tailwind class editor remains a low-level CSS escape hatch and can still express layout utilities. New first-class layout controls should update `layout`, not duplicate those values in editor metadata.

This shared representation powers:

- The visual editor
- The object tree
- The inspector
- Persistence
- Preview rendering
- React code generation

The architecture is intentionally designed so that the editor can evolve without coupling the visual interface directly to the exported code.

Existing locally saved Phase 3 workspaces are migrated from the previous separate root-item/child-node shape when the new schema is loaded.

🛠️ Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS

The project aims to remain lightweight and understandable rather than depending on a large visual-editor framework.

🗺️ Roadmap

Editor

- [x] Visual canvas
- [x] Component tree
- [x] Nested components
- [x] Component selection
- [x] Inspector
- [x] Unified node model with separate props, styles, layout, and editor metadata
- [x] Multiple pages
- [x] Local persistence
- [x] React project export
- [x] Advanced object-tree manipulation
- [x] Drag-and-drop reordering
- [x] Move components between containers
- [x] Edit node names and IDs independently
- [x] Expand and collapse scene-tree branches
- [x] Select and transform nested nodes, including position, size, rotation, and scale
- [ ] Contextual quick actions
- [ ] Undo / redo

Layout

- [ ] Flexbox controls
- [ ] CSS Grid controls
- [ ] Spacing and alignment controls
- [ ] Responsive breakpoints
- [ ] Responsive preview
- [ ] Better layout-aware editing

Components

- [ ] Forms and inputs
- [ ] Images and media
- [ ] Links
- [ ] Lists
- [ ] Reusable components
- [ ] Component customization

Code Generation

- [x] React project export
- [ ] Cleaner component generation
- [ ] Automatic component extraction
- [ ] Asset management
- [ ] Improved TypeScript generation
- [ ] More maintainable generated code

Future: Interactions

A long-term goal is to make Canvas Builder more than a static UI designer.

The planned interaction system is inspired by event/signal systems found in game engines such as Godot.

For example:

Button
   │
   │ onClick
   ▼
API Request
   │
   ▼
JSON Response
   │
   ▼
State / Data
   │
   ▼
UI Components

This could eventually allow users to visually define:

- Events
- API requests
- State
- Data binding
- Conditions
- Loading and error states
- Dynamic UI updates

The interaction system is intentionally planned for a later stage. The current priority is building a solid visual editor and reliable React code-generation pipeline first.

🎯 Philosophy

Canvas Builder is not intended to be another Figma clone.

Its primary goal is to make visual UI development and real frontend development meet in the middle.

A developer should be able to visually construct an interface, inspect its structure, export it, open the generated React project, and continue developing it normally.

Design visually. Own the code.

🤝 Open Source

Canvas Builder is free and open source.

Contributions, ideas, bug reports, and experiments are welcome as the project evolves.