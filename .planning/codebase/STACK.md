# Technology Stack (`STACK.md`)

This document outlines the software engineering stack, languages, frameworks, and key libraries used across the mailer project.

---

## 💻 Frontend Stack

| Component | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `^19.2.6` | Modern React UI library using functional components and hooks. |
| **Build Tool** | Vite | `^6.1.1` | Next-generation frontend tooling for fast hot module replacement. |
| **Styling** | Tailwind CSS | `^4.0.0` | Utility-first CSS framework integrated via Vite plugin (`@tailwindcss/vite`). |
| **Icons** | Solar Icons | `^2.1.1` | Premium vector icons optimized for React (`@solar-icons/react-perf`). |
| **Linter** | ESLint | `^9.15.0` | Code quality and standard checking. |

---

## ⚙️ Backend Stack

| Component | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>=18` | High-performance asynchronous JavaScript server environment. |
| **Web Server** | Express | `^4.21.2` | Minimalist web application framework for routing and middleware. |
| **Database** | MongoDB | via Mongoose `^8.9.5` | ODM (Object Document Mapper) for modeling and querying database. |
| **Queue Manager** | BullMQ | `^5.34.4` | Redis-based message queue for robust background job processing. |
| **SMTP Client** | Nodemailer | `^6.9.16` | Robust package for composing and sending emails via SMTP. |
| **Encryption** | bcryptjs | `^2.4.3` | High-security bcrypt password hashing. |
| **Authentication**| JSON Web Token | `^9.0.2` | Stateless authorization via JWT (`jsonwebtoken`). |
| **Process Control**| nodemon | `^3.1.14` | Hot-reloading development server for files. |

---

## 🛢️ Infrastructure & Middleware

- **Database Server:** MongoDB (standard document database).
- **In-Memory Broker:** Redis (acting as the storage engine for BullMQ queues).
- **SMTP Mail Relay:** Postfix SMTP Mail Relay hosted inside a Docker container (configured to send emails via VPS static IP).
- **Environment Management:** Managed through `.env` configurations via `dotenv`.
