# System Architecture (`ARCHITECTURE.md`)

This document details the software architecture patterns, component layouts, state flows, and execution pathways of the Mailer application.

---

## 🏛️ Architecture Overview

The Mailer application is structured around a **Decoupled Client-Server & Background Worker Pattern**. Rather than sending emails inside synchronous HTTP request lifecycles (which would cause timeouts and blocking UI operations), the application utilizes a robust background queuing mechanism powered by Redis and BullMQ.

```
       +--------------------------------------------+
       |               React Frontend               |
       |       (Dashboard, Compose, Domains)        |
       +---------------------+----------------------+
                             |
                             | HTTP REST APIs (JWT Auth)
                             v
       +---------------------+----------------------+
       |            Express HTTP Server             |
       |  (User auth, Campaign creation, Launch)    |
       +----------+----------------------+----------+
                  |                      |
    Read / Write  |                      | Bulk Add Jobs
    Campaigns     |                      | to Queue
    & Domains     v                      v
       +----------+----------+     +-----+----------+
       |   MongoDB Database  |     |   Redis Cache  |
       |  (Schemas & States) |     |  (BullMQ queue)|
       +----------+----------+     +-----+----------+
                  ^                      ^
                  | Read / Write         | Fetch & Lock
                  | Capacity & Status    | Sending Jobs
                  +----------+-----------+
                             |
       +---------------------+----------------------+
       |           BullMQ Background Worker         |
       | (Capacity reservation, throttling, sending)|
       +---------------------+----------------------+
                             |
                             | SMTP (Port 25)
                             v
       +---------------------+----------------------+
       |       Postfix SMTP Mail Relay Server       |
       |       (OpenDKIM signing, SPF, DMARC)       |
       +--------------------------------------------+
```

---

## ⚙️ Core Components

### 1. The Client (React Frontend SPA)
- **State Orchestration:** Located in `App.jsx`, which maintains global state for the active session (JWT & user info), active views (`overview`, `domains`, `compose`), and toast feedback notifications.
- **Component Layouts:**
  - **Sidebar:** Dynamic sidebar that lists sections and maps configured sending domains as individual "Stores" (Fashion Hive, HealthMart, etc.).
  - **DashboardView:** Supports Kanban and Table layout options, showing campaign metrics and launching drafts.
  - **DomainsView:** Configures new sending domains, displays their usage stats (usage today / daily limit) and status.
  - **ComposeView:** Handles campaign content creation, delayed profiles, sender rotation settings, and csv/text recipient parsing.

### 2. The API Server (Express)
- **Routing Layer (`api.js`):** Routes requests to dedicated controllers. Protects administrative resources via custom authentication middleware.
- **Controllers:**
  - **AuthController:** Issues JSON Web Tokens (JWT) for registered accounts, secures endpoints, and enforces administrator roles.
  - **DomainController:** Handles creation and listing of outbound sending identities.
  - **CampaignController:** Creates new campaign records. When a campaign is **launched**, it queries active sending domains, generates sub-jobs for every recipient, performs rotation computations, saves the campaign state as `Running`, and publishes all jobs in bulk to Redis.

### 3. The Message Broker & Worker Queue (Redis & BullMQ)
- **Redis Queue:** Holds serialized email sending jobs in `emailSendingQueue` for delayed, throttled, or failed retries.
- **Background Worker (`worker.js`):** A standalone, stateful process that runs concurrently with the API server. It does the heavy lifting:
  - Connects to MongoDB to keep states updated.
  - Verifies SMTP mail relay connectivity at startup.
  - Enforces a thread-safe **rate-limit reservation workflow** (verifies and increments a domain's daily limit).
  - Composes emails using Nodemailer and routes them to the local mail relay.
  - Throttles sending speed according to the campaign's delay settings.

### 4. Self-Hosted Mail Relay (Postfix SMTP)
- **Outbound Delivery:** A dedicated mail relay running inside Docker on a Hostinger VPS.
- **Cryptographic Trust:** Standardizes inbound/outbound trust by signing emails with DKIM keys via OpenDKIM, corresponding to DNS txt records.

---

## 🔄 Dynamic Workflows & Execution Pathways

### A. Campaign Launching Workflow
1. User clicks **Launch** in the UI.
2. Frontend sends a `POST /api/campaigns/:id/launch` request.
3. Express server:
   - Fetches the campaign structure and active domains.
   - Verifies the campaign status is `Draft` and that there are pending recipients.
   - Computes domain selection for each recipient based on `senderRotationMode`:
     - **Fixed:** Uses the first selected domain for all emails.
     - **Random:** Selects a random domain from the selected list for each recipient.
     - **Round-Robin:** Iterates sequentially through the list of domains for each recipient.
   - Builds a bulk job array and submits it to BullMQ (`emailSendingQueue.addBulk`).
   - Updates the campaign status to `Running`.

### B. Background Execution & Throttling Workflow
1. The BullMQ worker locks a job from the queue.
2. **Domain Reservation:** The worker queries MongoDB to reserve capacity on the specified sending domain using a specialized atomic `findOneAndUpdate` operation. If the domain's `dailyUsage` is equal to or exceeds `dailyLimit`, the operation throws an error, failing the job for a retry or mark-down.
3. **Delivery:** Worker triggers Nodemailer to send the message through the SMTP relay.
4. **Capacity Increment:** If delivery is successful, `totalEmailsSent` is incremented. If delivery fails *prior to acceptance*, `releaseDomainCapacity` is called to free up the daily allowance.
5. **Throttling/Delay:** The worker inspects the campaign's `delaySettings`:
   - **Fixed:** Sleeps for the specified number of seconds.
   - **Random:** Sleeps for a random duration between `min` and `max` seconds.
6. **Campaign Completion:** The worker updates the individual recipient's status to `sent` or `failed`. If no more `pending` recipients exist for that campaign, the campaign status is automatically updated to `Completed`.
