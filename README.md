# CLOVER irrigation decision demonstrator

Interactive early-stage CLOVER demonstration for forecast-informed irrigation scheduling.

The demo now combines the original synthetic water-balance comparison with farm-scenario presets adapted from Steve's `Farm_Scenarios.xlsx` workbook.

## Current scenario presets

- Tablelands — Centre Pivot
- Tablelands — Lateral Move
- Mackay / Eton — Centre Pivot IrrigWeb proof-of-concept

The interface also includes Google Maps regional context for Tablelands, Mackay/Eton, Bundaberg and Burdekin. These are regional locations only, not actual farm coordinates.

The simulator compares a baseline SWD-triggered irrigation strategy with a forecast-informed strategy using synthetic rainfall forecasts, rainfall probability, realised rainfall and a simplified soil-water/yield proxy.

The Mackay/Eton preset displays the workbook benchmark showing an average irrigation saving of about 0.77 ML/ha (about 11.3%; 31.35 ML total in the example) from the forecast ON/OFF IrrigWeb comparison.

## Files

- `index.html` — interface, scenario layer and map
- `style.css` — site styling
- `app.js` — scenario presets, synthetic weather, irrigation decision logic and charts

> Demonstration only. The current simulation is not an APSIM model result. It is designed so the simplified proxy can later be replaced with APSIM/IrrigWeb/API outputs.
