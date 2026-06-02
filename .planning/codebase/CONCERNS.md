# Technical Concerns & Risks (`CONCERNS.md`)

This document aggregates potential failure points, technical debt, security risks, and optimization opportunities identified across the Mailer codebase.

---

## ⚡ Critical Failure Points & Logic Risks

### 1. Hardcoded / Unauthenticated Mail Relay (Nodemailer Setup)
- **File:** `E:\mailer\backend\src\queues\worker.js` (lines 17-22)
- **Concern:** The Nodemailer transport is initialized using a direct SMTP host without checking for password credentials or encryption by default:
  ```javascript
  const transport = nodemailer.createTransport({
    host: process.env.MAIL_RELAY_HOST || 'mail',
    port: relayPort,
    secure: false,
    ignoreTLS: process.env.MAIL_RELAY_IGNORE_TLS !== 'false'
  });
  ```
- **Risk:** High dependency on external IP/security rules. If the Postfix container is exposed publicly on port 25 without strict IP binding, it could be hijacked as an open relay for spam sending.

### 2. Mock "Pending Verification" Domain Status
- **Files:** `domainController.js`, `worker.js`
- **Concern:** When adding a new domain, the status defaults to "Pending Verification" or can be manually selected. However, **there is absolutely no background domain verification check** (e.g. searching DNS records for verified DKIM selectors or SPF signatures) anywhere in the backend logic.
- **Risk:** Users can arbitrarily register any domain and manually switch its status to "Active", skipping SPF/DKIM validation entirely, leading to catastrophic bounce rates if the server tries to send mail on behalf of an unconfigured parent domain.

### 3. Stateful Capacity Throttling in Multi-Worker Environments
- **File:** `E:\mailer\backend\src\queues\worker.js` (lines 78-133)
- **Concern:** The capacity throttling limits are tracked inside MongoDB via `reserveDomainCapacity` and `releaseDomainCapacity` functions. While the database update uses atomic MongoDB operators (`$cond`, `$add`), the BullMQ concurrency is hardcoded to `1`:
  ```javascript
  const worker = new Worker('emailSendingQueue', processEmailJob, {
    connection,
    concurrency: 1
  });
  ```
- **Risk:** If scaling out the application by running multiple background worker processes concurrently on different servers, they will pull jobs in parallel. Since the capacity checks are atomic in DB, they won't exceed limits, but the campaign's `sleep(delaySeconds)` throttling mechanism inside individual workers is synchronous. While worker A is sleeping, it blocks its local thread. If concurrency is scaled, rate limits may be met, but the precise sleep delay between sent emails gets highly randomized, potentially triggering spam alert systems on Google/Yahoo due to sporadic bursts.

---

## 🔒 Security Concerns

### 1. Missing Rate Limits on Authentication API Endpoints
- **File:** `E:\mailer\backend\src\controllers\authController.js`
- **Concern:** The registration and login API endpoints do not utilize any rate-limiting middleware (like `express-rate-limit`).
- **Risk:** High susceptibility to brute-force dictionary attacks against user passwords or registration spam.

### 2. Loose CORS Policy Configuration
- **File:** `E:\mailer\backend\src\server.js` (line 13)
- **Concern:** Express is initialized with open CORS configuration: `app.use(cors());`.
- **Risk:** Allows arbitrary domains to make requests to the API server if user tokens are compromised. In production, this should be restricted to verified origins.

---

## 📉 Architectural & Code Quality Concerns

### 1. Monolithic State in Frontend (`App.jsx`)
- **File:** `E:\mailer\frontend\src\App.jsx`
- **Concern:** Handles all page routes, views, API fetch actions, forms submissions (login, registration, custom domain additions), and toast alerts inside a single `App` component exceeding 400 lines of code.
- **Risk:** Heavy re-renders across the client tree, low modularity, and difficult to scale or maintain as new dashboard views are added. Should be refactored to use a router (e.g. React Router) or context providers/state-management (like Zustand).

### 2. Lack of Automated Verification Tests
- **Files:** `package.json` configurations
- **Concern:** Zero test files exist. All logic verifications must be manually completed.
- **Risk:** Code changes to controllers, queues, or Mongoose models can silently break delivery flow logic or user authorization without immediate detection.
