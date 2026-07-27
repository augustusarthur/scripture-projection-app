# Attendance Ledger — locked live URL

**Do not create anonymous ShipStatic deploys for attendance.**

## Canonical church link (share this only)

https://attendance-ledger.shipstatic.com/?sync=019fa12a-e208-7876-b8f3-4f51e32a3093

- Host: `attendance-ledger.shipstatic.com` (stable platform domain — can be repointed on each publish)
- Sync id: `019fa12a-e208-7876-b8f3-4f51e32a3093`

## Agent / deploy rules

1. Never run anonymous `npx @shipstatic/ship` for attendance — it mints a disposable preview URL.
2. Code updates go in `docs/` (and the Next.js attendance app) as usual.
3. To publish to the **same** church link, use `SHIP_API_KEY` and:
   - `npx @shipstatic/ship ./docs --json`
   - `npx @shipstatic/ship domains set attendance-ledger.shipstatic.com <new-deployment>`
4. Keep `DEFAULT_SYNC_ID` in code equal to `019fa12a-e208-7876-b8f3-4f51e32a3093` (shared cloud roster).
5. Do **not** commit the ShipStatic API key.

## Install on iPhone (Home Screen app)

1. Open the church link above in **Safari** (not Chrome/Instagram in-app browsers).
2. Tap **Share** (square with ↑).
3. Tap **Add to Home Screen** → **Add**.
4. Open **Attendance** from your Home Screen — it runs full-screen like an app.

The installed app keeps the same sync link, so leaders stay on the shared roster.
