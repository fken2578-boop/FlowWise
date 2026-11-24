# Scientific unit tests

Run `node --test` from the repository root. [simulator.test.mjs](./simulator.test.mjs) exercises hydraulics, energy, economics and comparison through ES module imports. [units.test.mjs](./units.test.mjs) checks the display-unit adapters without a browser. Both files use Node's built-in test runner and strict assertions. The repository README gives the steps for reproducing the separate browser benchmark.

## Independent numerical fixtures

Use the constants in the specification. Keep expected numbers in the tests independent of production functions. For nonzero numeric results, require absolute error at most `max(1e-12, 1e-9 × |expected|)` in the stated unit. Check statuses, missing outputs and exact zeros separately. The fixtures are analytical examples, not measured data.

| Check | Inputs | Independent expectation |
| --- | --- | --- |
| Flow and laminar loss | `D = 0.1 m`, `Q = π/40000 m³/s`, `L = 100 m`, flat lift | `v = 0.01 m/s`, `Re = 1000`, `f = 0.064`. Hagen–Poiseuille gives `Δp = 32μLv/D² = 3.2 Pa`, hence `h_f = 3.2/9810 m`. |
| Smooth turbulent factor | `Re = 69000` and `ε = 0` | The argument of log10 is `10⁻⁴`. Haaland gives `f = 1/7.2²`. |
| Rough turbulent cross-check | `Re = 100000`, `ε/D = 0.001` | Solve Colebrook independently by bisection for `f` in [0.01, 0.05], using residual `1/√f + 2 log10(r/3.7 + 2.51/(Re√f))`. Require residual below `1e-10`. Allow 2% relative difference for this Haaland comparison only. |
| Static lift | Same supported flow and pipe, lift raised by 5 m | Friction loss is unchanged, total head rises by 5 m. Electrical input rises by `ρgQ × 5 / η` W. |
| Power, energy and bill | `Q = 0.01 m³/s`, `H = 10 m`, `η = 0.75`, `t = 2000 h/year`, `c = 0.20` | `981 W` hydraulic, `1308 W` electrical, `2616 kWh/year`, `523.20` currency/year. |
| Payback | Bills of 600 and 400 currency/year, `I = 1000` | Annual saving 200, payback 5 years. Swap bills for a saving of −200 and unavailable payback. Test identical bills and zero investment separately. |

## Boundary and integration checks

- Exercise the regime selector directly at 2299.99, 2300, 3999.99 and 4000. Expect laminar, transitional, transitional and turbulent respectively. At the upper limit accept `10⁸` and reject larger Re. Verify that transition or invalid input in either design clears dependent comparison outputs.
- Reject blank strings at the UI boundary, NaN, Infinity, nonpositive flow/diameter/length, negative lift/roughness/tariff/cost, efficiency outside (0, 1] and hours outside [0, 8760]. Accept a smooth pipe, flat lift, unit efficiency and exactly 8760 hours. Exercise the relative roughness limit and a finite input causing overflow.
- At a fixed supported duty, double length and verify that friction head doubles. Raise efficiency and verify electrical power falls while hydraulic power stays fixed. Keep Re turbulent and increase roughness to verify that friction rises.
- Zero hours gives zero energy and cost. Zero tariff gives zero cost at positive energy. Both cases give unavailable payback when annual savings are zero. Positive savings with zero capital cost gives zero payback.
- Verify presentation conversions independently with 10 L/s → 0.01 m³/s, 100 mm → 0.1 m and 75% → 0.75. For a browser regression check, enter the laminar fixture through the UI and compare the displayed head loss against the analytical result at the displayed precision.
