# Attendance Ledger — locked live URL

**Do not create a new ShipStatic deploy URL.**

## Canonical church link (share this only)

https://tactile-void-p94b4pf.shipstatic.com/?sync=019f9be4-bfa4-730d-b396-bdeafbd8cb4a

- Host: `tactile-void-p94b4pf.shipstatic.com`
- Sync id: `019f9be4-bfa4-730d-b396-bdeafbd8cb4a`

## Agent / deploy rules

1. Never run anonymous `npx @shipstatic/ship` for attendance — it mints a **new** URL.
2. Code updates go in `docs/index.html` and the Next.js attendance app as usual.
3. To publish updates to the **same** live URL after the owner claims it, use a ShipStatic API key and deploy to that existing deployment/domain only.
4. Keep `DEFAULT_SYNC_ID` in code equal to `019f9be4-bfa4-730d-b396-bdeafbd8cb4a`.

## Claim link (one-time, for permanence)

https://my.shipstatic.com/claim/4d9b490619efe1750c501e612974ffd1c719454edbab885c718c39a12ffda91b
