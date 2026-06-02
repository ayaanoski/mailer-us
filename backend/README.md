# Mailer MVP

The application uses hosted MongoDB and hosted Redis from `backend/.env`.
For local development, outbound email is handed to a Postfix relay running in
Docker. Domain records contain sender identities and usage limits only. Team
members do not enter SMTP credentials in the dashboard.

## Start

```bash
cd backend
docker compose up --build -d mail-relay
npm install
npm start
```

In a second terminal:

```bash
cd backend
npm run worker
```

Open `http://localhost:4000`.

## Delivery Model

The worker connects to `MAIL_RELAY_HOST` and `MAIL_RELAY_PORT`. For a
host-based worker, use:

```env
MAIL_RELAY_HOST=127.0.0.1
MAIL_RELAY_PORT=2525
MAIL_RELAY_IGNORE_TLS=true
```

The relay container submits mail directly to recipient mail servers. Real
delivery requires domains you control, correct SPF, DKIM, DMARC, and PTR DNS
records, and a network that permits outbound TCP port 25. Many residential and
corporate networks block port 25. Docker does not bypass that restriction.

For development, start with addresses you own and low volume. A local relay is
useful for validating the end-to-end MVP, but reliable production delivery
requires a static IP, domain verification, bounce processing, monitoring, and
IP reputation management.

## Useful Commands

```bash
docker compose logs -f mail-relay
docker compose stop mail-relay
npm run check
```
