# Self-Hosted Mail Server Setup & Deliverability Checklist

This document tracks the steps required to host your own mail relay server (Postfix Docker container) and configure domain parameters so that emails sent from `vinsmoke.org` bypass spam filters and are successfully delivered to Gmail/Yahoo inboxes.

---

## Phase 1: Hostinger VPS & Network Provisioning
- [ ] **Launch Hostinger VPS**
  - Purchase a Hostinger KVM VPS plan (Ubuntu 22.04 LTS recommended).
  - Ensure the VPS is assigned a **dedicated static public IPv4 address**.
- [ ] **Request Hostinger Port 25 Outbound Access**
  - Hostinger blocks TCP port 25 by default to prevent spam.
  - Submit a support ticket/chat request in the Hostinger hPanel. 
  - *Sample message:* "I am setting up a transactional outbound mail relay for `vinsmoke.org`. I have configured SPF, DKIM, and DMARC. Please unblock outbound TCP Port 25 for my VPS IP."
- [ ] **Configure Reverse DNS (PTR Record) in hPanel**
  - Log in to Hostinger hPanel -> Go to **VPS** -> Select your server.
  - Navigate to **IP Address** -> Find your IP and click the **Edit icon** next to Reverse DNS (PTR).
  - Enter `mail.vinsmoke.org` and save. (This updates instantly without needing support approval).
- [ ] **Configure Forward DNS (A Record)**
  - In the domain registrar for `vinsmoke.org`, create an `A` record pointing `mail` to your Hostinger VPS static public IP.
  - *Example:* `mail.vinsmoke.org` -> `<HOSTINGER_VPS_IP>` (TTL: 3600)

---

## Phase 2: Domain Security & Authentication DNS Records
These DNS records must be added to the DNS manager for the parent domain `vinsmoke.org`:

- [ ] **MX Record (Mail Exchange)**
  - Directs bounce responses and incoming mails to your server.
  - **Type:** `MX` | **Name:** `@` | **Value:** `mail.vinsmoke.org` | **Priority:** `10`
- [ ] **SPF Record (Sender Policy Framework)**
  - Authorizes your VPS static IP to send emails on behalf of `vinsmoke.org`.
  - **Type:** `TXT` | **Name:** `@` | **Value:** `v=spf1 ip4:<VPS_STATIC_IP> ~all`
- [ ] **DMARC Record (Domain-based Message Authentication)**
  - Defines the action receivers should take if SPF/DKIM validation fails.
  - **Type:** `TXT` | **Name:** `_dmarc` | **Value:** `v=DMARC1; p=quarantine; pct=100; rua=mailto:postmaster@vinsmoke.org`
  - *Note: Replace `postmaster@vinsmoke.org` with an email address where you want to receive XML reports.*

---

## Phase 3: DKIM (DomainKeys Identified Mail) Setup on Relay
To ensure emails are cryptographically signed, DKIM must be configured on the self-hosted relay:

- [ ] **Install OpenDKIM inside the Postfix Environment**
  - Generate a DKIM keypair (default selector `default`) for `vinsmoke.org`.
- [ ] **Publish DKIM Public Key in DNS**
  - **Type:** `TXT` | **Name:** `default._domainkey` | **Value:** `v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY_CONTENT>`
- [ ] **Configure Postfix to Sign Outbound Messages**
  - Connect Postfix's milter system to OpenDKIM.

---

## Phase 4: Project Application Setup
- [ ] **Configure Firewall Security on the VPS**
  - Restrict incoming connections to port `25` (Postfix) on the VPS so that **only** your application backend server IP is allowed to connect and relay emails through it.
- [ ] **Update `.env` in Backend**
  - Edit [backend/.env](file:///Users/tuhin/coding/mailer/backend/.env):
    ```env
    MAIL_RELAY_HOST=<YOUR_VPS_PUBLIC_IP>
    MAIL_RELAY_PORT=25
    MAIL_RELAY_IGNORE_TLS=true
    ```
- [ ] **Test Relay End-to-End**
  - Run the backend application and worker on your production server.
  - Launch a test campaign with a single recipient and inspect the Postfix mail log (`tail -f /var/log/mail.log` inside the VPS) to ensure the email is accepted and routed out.

---

## Phase 5: High-Volume IP Warmup Protocol (Target: 50,000/day)
Because this is a brand new IP address, sending 50k emails immediately will result in an instant permanent block from Gmail and Yahoo. You must gradually warm up the IP over 6 weeks using engaged recipients:

- [ ] **Warmup Schedule:**
  - **Week 1:** Max **500** emails/day.
  - **Week 2:** Max **1,500** emails/day.
  - **Week 3:** Max **5,000** emails/day.
  - **Week 4:** Max **12,000** emails/day.
  - **Week 5:** Max **25,000** emails/day.
  - **Week 6:** Reach target **50,000** emails/day.
- [ ] **Setup Google Postmaster Tools**
  - Verify `vinsmoke.org` on [Google Postmaster Tools](https://postmaster.google.com/) to monitor your domain/IP reputation and spam rate.
- [ ] **Setup Yahoo/SNDS Monitoring**
  - Set up monitoring for Yahoo/AOL and Microsoft SNDS (Smart Network Data Services) to track IP health.
- [ ] **List Hygiene & Bounce Rates**
  - Keep bounce rates below **2%** and spam report rates below **0.1%** (Gmail's strict enforcement threshold). Clean out unengaged/invalid addresses from your list prior to sending.
- [ ] **Check Blacklists**
  - Monitor your IP reputation weekly using tools like [MxToolbox](https://mxtoolbox.com/) or [Talos Intelligence](https://talosintelligence.com/) to ensure it isn't listed on major blacklists.
