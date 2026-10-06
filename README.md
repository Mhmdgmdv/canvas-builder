The Idea is simple but yet powerful
We give the users a canvas and they can draw anything they want on it
and then they can export the ui in react code

let me give you some phases

[x] Phase 1

Init git repository and publish it public in github

Start creating basic shapes and components that are used a lot in web apps such as header or hero card, texts, buttons, etc.

The finish line of this phase is when a user can open a canvas, give it a name (which is the name of the page), and draw components on it.
No need for exporting yet.

## Code organization

Canvas editor code lives under `src/core/`. The editor UI is split into focused components, canvas item data and component definitions live in `models/`, and `factories/CanvasItemFactory.ts` creates canvas items. React state in the editor manages selection, movement, and deletion.

## [x] Phase 2

Added common canvas primitives including containers, sections, inputs, and images, alongside the Phase 1 components. Each component has an editable nested structure: users can select children, change text and Tailwind classes, add children to containers and buttons, or delete children. Buttons contain editable text elements.

Use the Inspector to select an element, update its content or classes, choose from common Tailwind utility classes, and manage its child elements. Component structure and styles are modeled separately from the editor UI under `src/core/`.

## [x] Phase 3

Added page creation, selection, renaming, deletion, and local workspace persistence. The left-side Scene panel provides a node tree, an object picker, and an Inspector for editing styles and position, size, and rotation. New objects are created at the page root or nested under the selected node, and the canvas grows to fit positioned and transformed content.

React project export downloads a ZIP with generated page components under `src/pages/` and shared rendering components under `src/components/`.
