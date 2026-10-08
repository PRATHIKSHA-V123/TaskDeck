# TaskDeck – My Tasks (JavaScript Logic & State Management)

Thiranex Internship – Task 3. An interactive, client-side To-Do List built with HTML, CSS and vanilla JavaScript to practise DOM manipulation, event handling and local data persistence.

## Task requirements covered
| Requirement | How it is done |
|---|---|
| Full CRUD | Add, view, edit (modal) and delete tasks |
| Persist data with `window.localStorage` | Tasks, theme and accent colour are saved automatically and restored on reload |
| Advanced filtering | All / Active / Completed buttons, live search, and sorting (newest, oldest, priority, due date) |
| Dynamic DOM + delegated listeners | Task items are created with `document.createElement`; one `click` and one `change` listener on the list handle every task |

## Extra features
- Sidebar dashboard with stats, progress ring and filters
- Priority (low / medium / high), category and due date per task
- Overdue and "Due today" highlighting
- Undo for delete and clear-completed
- Light and dark mode plus four accent themes (Ocean, Violet, Emerald, Sunset)
- responsive layout, keyboard support (Enter to add, Esc to close modal), reduced-motion support

## Files
`index.html`, `style.css`, `script.js`

## Run
Open `index.html` in a browser. No install needed.
