# Family Strategic Reserve App

Web-based stock management for a household of 6 in Nairobi.
Tracks progressive build-up of critical food and non-food reserves.

## Features
- Dashboard with colour-coded status (Green / Yellow / Orange / Red)
- Record incoming stock by weight or count (weighing scale ready)
- Record withdrawals — stock decreases automatically
- Progress toward 3-month critical targets
- Transaction history
- Editable targets
- WhatsApp alert infrastructure ready (sending currently disabled)

## How to run
Open `public/index.html` in any modern browser, or serve the public folder:

```bash
cd public
python3 -m http.server 8080
```
Then open http://localhost:8080

Data is stored in the browser's localStorage (persists on the same device).

## Default Critical Targets (3-month floor)
- Dry Maize: 92 kg
- Rice: 36 kg
- Beans: 18 kg
- Dengu: 12 kg
- Sugar: 15 kg
- Cooking Oil: 13.5 L
- Wheat/Pasta: 18 kg
- Tea: 3.6 kg
- Salt: 3 kg
- Powdered Soap: 7.5 kg
- Bathing Soap: 24 bars
- Toilet Paper: 36 rolls
- LPG full reserve cylinders: 1

## WhatsApp
Go to Settings → enter API token and phone number when ready.
Sending code is already prepared but remains inactive until you enable it and supply credentials.
