# 🦀 Crab — Ride your way

A ride-hailing web app inspired by **Grab** and **inDrive**. Crab supports **both**
signature pricing models in one product:

- **⚡ Fixed fare (Grab-style)** — the system calculates an upfront price from
  distance and time, and auto-matches you with the nearest available driver.
- **🤝 Name your price (inDrive-style)** — you propose your own fare, nearby
  drivers accept or counter-offer, and you pick the driver you want.

Everything is real-time: live driver tracking on the map, live bidding, a full
ride lifecycle, ratings, ride history, and an in-app wallet.

> Maps use **Leaflet + OpenStreetMap**, so there is **no API key to configure** —
> the app runs out of the box.

---

## Tech stack

| Layer        | Tech                                                   |
| ------------ | ------------------------------------------------------ |
| Frontend     | React 18 · Vite · TypeScript · Tailwind CSS · Zustand  |
| Maps         | Leaflet + react-leaflet (OpenStreetMap tiles)          |
| Backend      | Node · Express · TypeScript                            |
| Real-time    | Socket.IO                                              |
| Database     | SQLite via Prisma ORM                                  |
| Auth         | JWT + bcrypt                                           |
| Geocoding    | OSM Nominatim (search) · OSRM (road routing)           |

Monorepo with npm workspaces: [`server/`](server) and [`client/`](client).

---

## Quick start

```bash
# 1. Install everything (also generates the Prisma client)
npm install

# 2. Create the SQLite DB and seed demo users + a simulated driver fleet
npm run db:setup

# 3. Run the API (:4000) and the web app (:5173) together
npm run dev
```

Open **http://localhost:5173**.

### Demo accounts

| Role   | Email             | Password      |
| ------ | ----------------- | ------------- |
| Rider  | `rider@crab.dev`  | `password123` |
| Driver | `driver@crab.dev` | `password123` |

Plus **6 simulated drivers** that come online automatically and respond to
requests — so you can experience the entire flow **in a single browser window**
without needing a second person.

---

## Try it

### Fixed fare (auto-match)

1. Sign in as the **rider**.
2. Set a pickup (uses your location, or tap the 📍 button then the map) and a
   destination (search or tap the map).
3. Keep the **⚡ Fixed fare** tab and hit **Request**.
4. A nearby driver accepts within a couple of seconds; watch the car drive to
   you and then to your destination. Rate the trip at the end.

### Name your price (bidding)

1. As the rider, switch to the **🤝 Name price** tab and enter an offer (quick
   presets are provided).
2. Send the offer. Drivers' bids stream in live — some accept your price, some
   counter slightly higher.
3. Pick a driver by tapping **Accept**, then track the trip to completion.

### Drive it yourself

Open a second browser (or an incognito window), sign in as
`driver@crab.dev`, toggle **online**, and you'll receive real ride requests from
the rider window. Accept fixed fares or place bids, then **tap the map to drive
your car** toward the pickup and drop-off pins.

---

## How it works

- **REST API** (`/api/*`) handles auth, fare/route estimates, ride history,
  wallet, profile, and ratings.
- **Socket.IO** powers everything live: driver location streaming, ride
  requests, the bidding exchange, status transitions, and settlement.
- A central **`RideEngine`** ([`server/src/sockets/engine.ts`](server/src/sockets/engine.ts))
  owns all ride state changes and emits; both real users and the
  **simulated fleet** ([`server/src/sockets/simulation.ts`](server/src/sockets/simulation.ts))
  drive rides through the exact same code paths.
- On completion the fare is **settled between wallets** (rider debited, driver
  credited) inside a DB transaction.

### Ride lifecycle

```
REQUESTED → MATCHED → ARRIVING → IN_PROGRESS → COMPLETED
                                         └────→ CANCELLED
```

---

## Configuration

Server config lives in `server/.env` (auto-created from `.env.example` on first
run):

| Variable          | Default                  | Purpose                                    |
| ----------------- | ------------------------ | ------------------------------------------ |
| `PORT`            | `4000`                   | API + Socket.IO port                       |
| `JWT_SECRET`      | `change-me-in-production`| Token signing secret                       |
| `CLIENT_ORIGIN`   | `http://localhost:5173`  | CORS origin for the web app                |
| `DATABASE_URL`    | `file:./dev.db`          | SQLite database                            |
| `SIMULATED_FLEET` | `true`                   | Set `false` to disable the auto-drive bots |

---

## Scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Run server + client together                        |
| `npm run db:setup`  | Push schema + seed demo data                        |
| `npm run seed`      | Re-seed demo data                                   |
| `npm run build`     | Production build of server and client               |
| `npm run typecheck` | Type-check both packages                            |

---

## Project structure

```
server/
  prisma/schema.prisma      # User, Driver, Ride, Bid, Rating, Wallet, Transaction
  prisma/seed.ts            # demo rider/driver + simulated fleet
  src/routes/               # auth, rides, wallet, users (REST)
  src/services/             # pricing, routing (OSRM), matching
  src/sockets/              # engine, socket wiring, simulated fleet
client/
  src/pages/                # Landing, Login, Register, RiderHome, DriverHome,
                            #   RideHistory, Wallet, Profile
  src/components/            # Map, AddressSearch, RatingModal, Stars, Navbar
  src/store/                # auth (Zustand)
  src/lib/                  # api, socket, geo, format helpers
```
