# FlowWise engineering specification

## Question and scope

At a prescribed flow, how do pipe diameter, wall roughness and pump efficiency affect the annual cost of delivering water between two reservoirs? Compare a baseline with one user-specified upgrade at the same duty. The comparison reports which of the two costs less to run.

The model assumes steady, incompressible, Newtonian water, a full circular pipe with uniform inner diameter, fully developed flow, open reservoirs at the same atmospheric pressure and negligible reservoir surface velocity. Use fixed, rounded teaching values `ρ = 1000 kg/m³`, `μ = 0.001 Pa·s` and `g = 9.81 m/s²`. Friction head and static lift use metres of water.

## Inputs and units

| Quantity | Model unit and supported values |
| --- | --- |
| Volumetric flow `Q` | m³/s, positive |
| Straight pipe length `L` and inner diameter `D` | m, positive |
| Absolute wall roughness `ε` | m, nonnegative, `ε/D ≤ 0.05` |
| Static lift `Δz = z_out − z_in` | m, nonnegative, measured between reservoir free surfaces |
| Combined pump and drive efficiency `η` | Dimensionless, `0 < η ≤ 1`, constant at the prescribed duty |
| Annual operating time `t` | h/year, 0 to 8760 inclusive, one representative non-leap year |
| Flat electricity tariff `c` | User-specified currency/kWh, nonnegative |
| Incremental installed upgrade cost `I` | Same currency as the tariff numerator, nonnegative |

The UI converts L/s to m³/s and mm to m by dividing by 1000, and percent efficiency to a fraction by dividing by 100. Label each field and each output with its unit. Use one currency for both designs. Keep full precision until display. Reject missing, nonnumeric, nonfinite and out-of-domain values. An invalid edit must clear affected prior results.

## From pipe flow to pump head

1. Compute cross-sectional area `A = πD²/4`, mean speed `v = Q/A` in m/s, Reynolds number `Re = ρvD/μ` and relative roughness `r = ε/D`. Classify using the unrounded Reynolds number.
2. Select the Darcy friction factor `f` from the table below.
3. Darcy–Weisbach major head loss is `h_f = f (L/D) v²/(2g)`. Frictional pressure loss is `Δp_f = ρg h_f` in Pa.
4. Required pump head is `H = Δz + h_f`. An elevation change contributes to pump head independently of pipe friction.

| Unrounded Re | Project rule |
| --- | --- |
| `0 < Re < 2300` | Laminar. Use `f = 64/Re`. |
| `2300 ≤ Re < 4000` | Transitional. Show flow, speed, Re and a regime warning. Return unavailable for `f`, losses, total head, power, energy and cost. Suppress savings and payback if either design is transitional. |
| `4000 ≤ Re ≤ 10⁸` | Turbulent. Use the Haaland liquid-flow approximation, `f = 1 / {−1.8 log10[(r/3.7)^1.11 + 6.9/Re]}²`. |
| `Re > 10⁸` | Outside the project's supported range. Flag the input and withhold dependent results. |

The cutoffs are project conventions. Actual transition depends on disturbances and inlet conditions. The upper Reynolds and roughness limits bound the demonstration. For the friction equations, see equations 12–14 in the [Lund University pipe-flow laboratory notes](https://www.lth.se/fileadmin/ht/Kurser/MMV211/Lab2a-PM-English.pdf).

## From power to simple payback

| Output | Calculation |
| --- | --- |
| Hydraulic power delivered to water, W | `P_h = ρgQH` |
| Electrical input power, W | `P_e = P_h/η`, where `η` includes pump, motor and drive losses |
| Annual electricity use, kWh/year | `E = (P_e/1000) t` |
| Annual electricity bill, currency/year | `C = E c` |
| Annual savings, currency/year | `S = C_baseline − C_upgrade`. Preserve the sign. |
| Simple payback, years | `I/S` when `S > 0`, including zero years for a free upgrade. For `S ≤ 0`, show “No positive annual savings” and omit the numeric payback. |

Hold `Q`, `L`, `Δz`, `t`, water properties and `c` common when comparing designs. Each design may have its own `D`, `ε` and `η`. A comparison requires two supported hydraulic results. Warn when an intermediate or output exceeds finite numerical range.

## Limits of interpretation

This is a one-dimensional operating-point estimate. It omits fittings, entrance/exit losses, pipe networks, pump curves, cavitation, transients, downhill energy recovery and changes in fluid properties with temperature. A real pump must be checked against its curve to verify that it can supply the specified flow and head. The model computes bulk quantities and cannot resolve a velocity field. Local tariff schedules, varying demand, maintenance, financing and discounting can change actual savings and payback.

## Implementation boundary

Use pure ES modules in `src/model/` for SI inputs, validation and computations. Return numbers with explicit regime/status values and use `null` for unavailable outputs. The model must run under Node without a DOM. Keep DOM access, form-unit conversions, warnings and formatting in `src/ui/`. The deployed page runs locally in the browser with native HTML, CSS and JavaScript, without an API, database or runtime package.

### Phase 1 result contract

`calculateDesign(duty, design)` returns a fresh result on each call. `duty` supplies `flowM3s`, `lengthM`, `staticLiftM`, `hoursPerYear` and `tariffPerKwh`. `design` supplies `diameterM`, `roughnessM` and `efficiency`. Pass finite numbers in model units. Model results retain numerical precision and the first blocking condition in calculation order.

| Status | Interpretation |
| --- | --- |
| `ok` | All requested quantities are available. |
| `transitional` | Flow falls in the transition interval. Downstream estimates are unavailable. |
| `invalid-input` | The input identified by `field` is missing or violates its domain. |
| `out-of-range` | The computed Reynolds number exceeds the specified range, or a numerical stage cannot represent the result. |
| `unavailable` | At least one design prevents a comparison. Inspect the nested `baseline` and `upgrade` results. |
| `no-positive-savings` | Both bills are available. Annual savings are zero or negative and simple payback is unavailable. |

Read the numeric fields from the current result, including any `null` values. For example, a bad tariff preserves computed power and energy and returns `null` for the bill. For a comparison, `annualSavings` carries the signed difference and `paybackYears` carries the simple payback when defined.
