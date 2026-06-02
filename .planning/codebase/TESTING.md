# Verification & Testing Strategy (`TESTING.md`)

This document describes the testing practices, validation scripts, lint rules, and quality assurance strategies established for the Mailer project.

---

## 🧪 Current Test Coverage Status

There are currently **no automated unit tests or integration tests** (such as Jest, Vitest, Cypress, or Playwright) configured in the codebase package files.

---

## 🛠️ Verification Utilities & Syntax Checkers

### 1. Backend Syntax Checks (`npm run check`)
The backend `package.json` includes a custom verification script designed to test syntax correctness of JavaScript files before deployment:
```bash
npm run check
```
This runs Node's built-in syntax checker (`node --check`) against the following critical files:
- `src/server.js` (Server entry point)
- `src/config/db.js` & `src/config/queue.js` (Infrastructure configurations)
- `src/models/User.js`, `src/models/Domain.js`, `src/models/Campaign.js` (Database models)
- `src/controllers/authController.js`, `src/controllers/domainController.js`, `src/controllers/campaignController.js` (Controllers)
- `src/queues/worker.js` (Queue workers)
- `src/routes/api.js` (API endpoints)
- `public/app.js` (Static public app code)

### 2. Frontend Linter (`npm run lint`)
The frontend contains an ESLint environment configured in `eslint.config.js` to flag syntax errors, unused variables, and potential React hook issues:
```bash
npm run lint
```

---

## 🔄 Recommended Manual Verification Plan

To verify features or code modifications during local development, use the following manual testing checklist:

### A. Run Local Development Server
1. Launch MongoDB and Redis locally.
2. In one terminal, start the API web server:
   ```bash
   cd backend
   npm run dev
   ```
3. In a second terminal, start the background worker:
   ```bash
   cd backend
   npm run worker:dev
   ```
4. In a third terminal, start the Vite client:
   ```bash
   cd frontend
   npm run dev
   ```

### B. End-to-End Campaign Delivery Verification
1. Open the web browser to the Vite dev URL.
2. **Registration/Login:** Register a new account. Ensure the database successfully hashes the password and returns a valid session.
3. **Add Sending Domain:** Go to the "Domains" tab and add a domain (e.g. `vinsmoke.org`). Change its status to **Active** to bypass verification logic.
4. **Draft Campaign:** Go to the "Compose" tab:
   - Provide name and subject.
   - Insert dummy HTML content.
   - Enter one or two test recipient email addresses.
   - Select the newly added domain under "Active Sending Domains".
   - Set a fixed delay profile (e.g., `1` second).
   - Save the Campaign Draft.
5. **Launch Delivery:** Go to the "Dashboard" tab, find the saved draft, and click **Launch**.
6. **Worker Audits:** Inspect the background worker terminal window:
   - Verify that the worker successfully connects to SMTP.
   - Confirm capacity reservation runs, increments `dailyUsage`, and logs `Email job completed`.
   - Ensure the recipient's status changes to `sent` in MongoDB, and the campaign changes to `Completed`.
7. **Inspect Mail Logs:** If using a local mail relay testing tool (like Mailpit), open the interface to inspect the delivered email's headers, subject, and HTML content.
