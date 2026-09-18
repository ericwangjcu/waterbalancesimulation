# CLOVER farm irrigation demonstrator

Interactive CLOVER demonstration built around the farm and irrigation-system assumptions in Steve's `Farm_Scenarios.xlsx` workbook.

## Five demonstration levels

1. **Understand CLOVER** — Tablelands Centre Pivot, 4 IMUs. Baseline and CLOVER see the same realised weather; only CLOVER can delay an irrigation for qualifying forecast rainfall.
2. **Existing evidence** — shows Steve's Mackay/Eton IrrigWeb Forecast ON/OFF workbook results separately from the synthetic web simulation.
3. **Farmer value** — switch between non-limited water (irrigation/pumping efficiency) and limited water (preserve allocation/reduce stress).
4. **Farm systems** — compare the workbook Centre Pivot, Lateral Move, Mackay overhead traveller and Burdekin furrow setups.
5. **Full CLOVER** — multiple IMUs can need irrigation together; a single irrigation slot is allocated using fixed order, crop age, highest SWD or highest accumulated stress.

## Workbook-derived farm assumptions

The interface uses workbook IMU counts, crop-class layouts, areas, pump flows, irrigation depths/cycles, scheduling/automation descriptions and water-allocation context where they are specified. Google Maps provides regional context only, not actual farm coordinates.

The Mackay/Eton evidence panel reports the workbook example: about **31.35 ML total**, **0.77 ML/ha average** and **11.3% average irrigation saving**, with very similar reported yields between Forecast Yes and No.

## Demonstration assumptions

Rainfall, forecast probability and daily crop-water demand are synthetic. Crop-class daily-demand multipliers and the Level 5 priority rules are demonstration logic, not values supplied by the workbook. The workbook does not state a minimum furrow cycle, so the web demo labels its 7-day cycle as an inference from 7 IMUs × 24 h per irrigation.

## Files

- `index.html` — five-level interface and Google Maps regional context
- `style.css` — interface styling
- `app.js` — scenario data, synthetic weather, independent IMU water balances, forecast decisions and priority logic

> Demonstration only. This is not an APSIM result. The synthetic water-demand layer can later be replaced with APSIM/IrrigWeb daily outputs while retaining the farm-scenario and decision interface.
