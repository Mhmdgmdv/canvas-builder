import {
  CANVAS_COMPONENTS,
  CANVAS_COMPONENT_TYPES,
  type CanvasComponentType,
} from '../models/canvasNode'

type CanvasSidebarProps = {
  pageName: string
  onPageNameChange: (name: string) => void
  onAddComponent: (type: CanvasComponentType) => void
  onClearCanvas: () => void
  onDeleteSelected: () => void
}

export function CanvasSidebar({
  pageName,
  onPageNameChange,
  onAddComponent,
  onClearCanvas,
  onDeleteSelected,
}: CanvasSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="panel-header">
        <span className="status-pill">Phase 2</span>
      </div>

      <label className="field-group">
        <span>Page name</span>
        <input
          type="text"
          value={pageName}
          onChange={(event) => onPageNameChange(event.target.value)}
          placeholder="Landing page"
        />
      </label>

      <div className="component-panel">
        <h2>Components</h2>
        <div className="component-grid">
          {CANVAS_COMPONENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="component-tile"
              onClick={() => onAddComponent(type)}
            >
              <span className="tile-name">{CANVAS_COMPONENTS[type].label}</span>
              <small>{CANVAS_COMPONENTS[type].description}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="action-row">
        <button type="button" className="secondary-button" onClick={onClearCanvas}>
          Clear canvas
        </button>
        <button type="button" className="primary-button" onClick={onDeleteSelected}>
          Delete selected
        </button>
      </div>
    </aside>
  )
}
