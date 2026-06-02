# Coding Conventions & Standards (`CONVENTIONS.md`)

This document lists the coding standards, patterns, database styles, and architectural guidelines observed across the mailer project.

---

## 🛠️ General Styling & Style Guides

- **Language:** JavaScript (ES6+ standard).
- **Naming Conventions:**
  - Variables, functions, properties: `camelCase`.
  - React components, model classes: `PascalCase`.
  - Database collection schemas, system environments: `UPPER_SNAKE_CASE` or `lowercase`.
- **Formatting:** ESLint and standard JavaScript code styles are enforced in the projects.

---

## 💻 Frontend Patterns (Vite + React)

### 1. Functional Components
- All components are standard React functional components utilizing hooks (`useState`, `useEffect`).
- Component files are modularized under `frontend/src/components` (e.g. `Sidebar.jsx`, `DashboardView.jsx`).
- Uses modern ES6 import/export standard.

### 2. View Orchestration & State
- Global states (such as active token sessions, active screen tabs, global search inputs, and dynamic toast alerts) are hoisted to `App.jsx`.
- Components receive action handlers as props to avoid deep nested state propagation.

### 3. Styling & Layouts
- **Tailwind CSS v4** utility-first system is used for UI rendering, with theme configuration handled inside `index.css` via custom theme rules:
  ```css
  @theme {
    --color-brand: #f59e0b;
    --color-brand-hover: #d97706;
    --color-brand-light: #fef3c7;
  }
  ```
- **Semantic HTML5 structures** are strictly used (such as `<aside>`, `<main>`, `<section>`, `<article>`, and `<header>`).

### 4. Client API Layer
- Direct `fetch` calls are avoided. Instead, `apiFetch` from `utils/api.js` is imported.
- Token injection and session storage (LocalStorage syncing) are encapsulated inside this layer.

---

## ⚙️ Backend Patterns (Express + Node)

### 1. Module Management
- The backend utilizes CommonJS modules (`require` syntax).
- Configuration items are kept decoupled from code by using `.env` variables and loaded via `dotenv`.

### 2. MVC Controller Architecture
- Routes are declared in `api.js` and bound to clean, stateless handler functions in `controllers/`.
- Business logic is completely separated from the routing configuration.

### 3. Database Modeling (Mongoose)
- Models are separated into individual files under `models/`.
- Schema features:
  - Strict validation rules (required fields, uppercase constraints, lowercase normalization).
  - Pre-save hooks: Used in `User.js` to automatically hash user passwords via `bcrypt` with `12` salt rounds.
  - Custom schema-level validation: Handled in `Campaign.js` (e.g. ensuring `delaySettings.max >= delaySettings.min` for randomized profiles).
  - `timestamps: true` is set on schemas to automate `createdAt` and `updatedAt` field maintenance.

### 4. Background Job Processing
- Long-running processes are dispatched as independent jobs via BullMQ.
- **Worker Concurrency:** Configured with a concurrency value of `1` inside `worker.js` to guarantee single-threaded chronological execution, protecting against outbound email peaks or concurrent server load.
- **Failures & Backoff:** Designed with `attempts: 3` and `backoff` settings to handle temporary relay hiccups elegantly.
