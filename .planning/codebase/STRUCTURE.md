# Codebase Structure (`STRUCTURE.md`)

This document mapping outlines the folder structure, layouts, and responsibilities of the files within the mailer project.

---

## 📂 Project Directory Map

```
mailer/
├── backend/
│   ├── docker/                 # Production Docker configuration files
│   ├── src/                    # Node.js/Express source code
│   │   ├── config/             # Database and Queue initializations
│   │   │   ├── db.js           # Mongoose MongoDB connection
│   │   │   └── queue.js        # BullMQ queue and Redis client setup
│   │   ├── controllers/        # Express request handling controllers
│   │   │   ├── authController.js    # JWT authorization and registration
│   │   │   ├── campaignController.js# Campaign building and queue scheduling
│   │   │   └── domainController.js  # Sending domain addition and listing
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── Campaign.js     # Campaign and recipient structures
│   │   │   ├── Domain.js       # Domain registry and daily limit counters
│   │   │   └── User.js         # User models, passwords, and roles
│   │   ├── queues/             # Asynchronous workers
│   │   │   └── worker.js       # BullMQ worker: throttling, SMTP, capacity
│   │   ├── routes/             # API routing
│   │   │   └── api.js          # REST API endpoints mappings
│   │   └── server.js           # API express web server startup entry
│   ├── .env.example            # Environment template for variables
│   ├── docker-compose.yml      # Docker orchestrations (mail relay, redis)
│   ├── package.json            # Node backend dependencies and startup scripts
│   └── README.md               # Backend overview and setup guides
│
├── frontend/
│   ├── public/                 # Static assets folder
│   ├── src/                    # Vite + React source code
│   │   ├── assets/             # Images and styles
│   │   ├── components/         # Reusable React UI component panels
│   │   │   ├── ComposeView.jsx     # Campaign builder form
│   │   │   ├── DashboardView.jsx   # Campaigns dashboard board & table
│   │   │   ├── DomainsView.jsx     # Domains listing and addition form
│   │   │   └── Sidebar.jsx         # Menu navigation & sidebar stores
│   │   ├── utils/              # Client utility files
│   │   │   └── api.js              # Fetch wrapper & LocalStorage helpers
│   │   ├── App.css             # Main styling overrides
│   │   ├── App.jsx             # React core entry point (auth / view state)
│   │   ├── index.css           # Tailwind CSS imports & custom styling overrides
│   │   └── main.jsx            # DOM mounting entry point
│   ├── eslint.config.js        # ESLint environment configuration rules
│   ├── index.html              # Core HTML structure template
│   ├── package.json            # React dependencies and build scripts
│   ├── vite.config.js          # Vite plugins and proxies
│   └── README.md               # Frontend setup instructions
│
└── SELF_HOSTING_TODO.md        # Self-hosted VPS setup and IP warmup protocol
```

---

## 🗂️ Key Component Summary

| Component | Path | Primary Purpose |
| :--- | :--- | :--- |
| **API Entry** | `backend/src/server.js` | Starts the Express server, connects databases, binds middlewares. |
| **Worker Entry** | `backend/src/queues/worker.js` | Starts the BullMQ background worker, tests SMTP relays, handles mailing logic. |
| **Routes** | `backend/src/routes/api.js` | Standardizes API surface by binding endpoints to controllers. |
| **Queue Configuration** | `backend/src/config/queue.js` | Declares connection configurations and creates the BullMQ instance. |
| **UI Main** | `frontend/src/App.jsx` | Coordinates login states, route rendering, and global variables. |
| **UI Sidebar** | `frontend/src/components/Sidebar.jsx` | Displays primary menu options and list of sending domains as virtual stores. |
| **API Helper** | `frontend/src/utils/api.js` | Centralizes communication, inserts JWT headers, handles session persistence. |
| **Warmup Protocol**| `SELF_HOSTING_TODO.md` | Provides a detailed checklist for IP reputation warmup and DNS security. |
