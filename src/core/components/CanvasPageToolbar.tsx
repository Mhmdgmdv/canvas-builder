import type { CanvasPage } from '../models/canvasItem'

type CanvasPageToolbarProps = {
  pages: CanvasPage[]
  activePage: CanvasPage
  onSelectPage: (pageId: string) => void
  onCreatePage: () => void
  onRenamePage: (name: string) => void
  onDeletePage: () => void
  onExport: () => void
}

export function CanvasPageToolbar({
  pages,
  activePage,
  onSelectPage,
  onCreatePage,
  onRenamePage,
  onDeletePage,
  onExport,
}: CanvasPageToolbarProps) {
  return (
    <header className="page-toolbar">
      <nav className="page-tabs" aria-label="Project pages">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            className={`page-tab ${page.id === activePage.id ? 'is-active' : ''}`}
            onClick={() => onSelectPage(page.id)}
          >
            {page.name}
          </button>
        ))}
        <button type="button" className="new-page-button" onClick={onCreatePage}>
          + New page
        </button>
      </nav>

      <div className="page-actions">
        <label className="page-name-field">
          <span>Page</span>
          <input
            aria-label="Page name"
            value={activePage.name}
            onChange={(event) => onRenamePage(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="delete-page-button"
          disabled={pages.length <= 1}
          onClick={onDeletePage}
        >
          Delete page
        </button>
        <button type="button" className="export-button" onClick={onExport}>
          Export React project
        </button>
      </div>
    </header>
  )
}
