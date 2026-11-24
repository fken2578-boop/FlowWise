# Delivery plan

Time boxes are estimates for one developer and total 24 hours. Each phase ends at its acceptance gate.

| Phase | Time | Work and acceptance gate |
| --- | --- | --- |
| 0 · Foundation | 2 h | Initialize Git, serve the English skeleton, verify asset paths and document scope, equations, limitations, tests and AI use. |
| 1 · Calculation core | 5 h | Implement pure SI model functions for validation, hydraulics, energy and comparison. Run every planned scientific check in Node with a positive test count and zero failures. Record command, counts and any tolerance exceptions. |
| 2 · Single-design UI | 5 h | Enter one design, convert labeled units, and show regime, head, power, energy and bill. Check the laminar fixture through the form. Invalid and transitional edits clear stale numbers and explain the condition. |
| 3 · Design comparison | 4 h | Compare baseline and upgrade at common duty. Explain which inputs differ. Verify positive, zero and negative savings, payback visibility and equivalent-design results in the browser. |
| 4 · Demo and release | 5 h | Verify keyboard operation and a narrow mobile viewport. Rehearse a two-minute demo with one reproducible comparison. Run all tests again, publish on GitHub Pages, and verify the public project URL and relative assets in a fresh browser session. Record the URL and actual results. |
| Contingency | 3 h | Resolve failed gates and repeat affected checks before submission. |

## Status

Phases 0 through 3 passed their acceptance gates. Phase 4 public deployment and browser checks are complete. A timed presenter rehearsal and the developer's review of the competition submission materials remain open.

## Phase 0 verification · 2026-11-24

- The project directory started empty. Git 2.56.0.windows.4 initialized the local main branch. Node.js v26.12.1, npm 11.20.0 and Python 3.11.9 responded to version checks.
- Node's syntax check on the UI module exited successfully. Local Markdown links resolved to files.
- Python served the preview on loopback. The initial sandboxed HTTP client could not reach the server. The check succeeded with local loopback access.
- The browser displayed the English heading and the script-generated “Browser module loaded” indicator. Clicking “Model assumptions” expanded the control and displayed the reservoir and pipe assumptions.
- The first browser visit requested a missing favicon. After adding a project-relative icon, a fresh HTTP check returned 200 for the homepage, icon, stylesheet and module, with media types text/html, image/x-icon, text/css and application/javascript. All four response bodies matched the files on disk. All three asset references resolved under a simulated repository URL prefix.
- The preview servers were stopped. Numerical unit test execution and public GitHub Pages verification remain scheduled for their respective phase gates.

## Phase 1 verification · 2026-11-24

- Ran `node --test` in the project root. Node discovered 26 tests, with 26 passing, 0 failing and 0 skipped. The suite imported the model and unit adapters directly without a DOM.
- Ran the README example independently of the test runner. The laminar fixture returned Re ≈ 1000, Darcy factor ≈ 0.064 and frictional pressure loss ≈ 3.2 Pa. The fixed-head energy fixture returned 1308 W electrical input and 2616 kWh/year to the reported precision. The 600 versus 400 annual bill fixture returned 200 annual savings and 5 years of simple payback.
- Verified the two transition boundaries, out-of-domain Re, loss of dependent results in either comparison position, zero hours/tariff, invalid domains, conversion of display units and numerical range failures. The rough turbulent check used an independent Colebrook bisection with residual below 1e-10 and the planned 2% relative tolerance for Haaland versus Colebrook. No tolerance was relaxed.
- Browser form entry, interactive comparison and public deployment belong to the subsequent phase gates.

## Phase 2 verification · 2026-11-24

- Ran `node --test` with 26 passing tests, 0 failures and 0 skips. The browser module also passed `node --check src/ui/app.mjs`.
- Opened the locally served English form in the browser. The default example displayed turbulent flow, head of 6.59149 m, 1724.33 kWh/year and 344.867 CU/year.
- Entered the laminar benchmark through the form. The displayed values were Re = 1000, speed = 0.01 m/s, Darcy factor = 0.064, friction loss = 3.2 Pa and friction head = 0.000326198 m, consistent with the analytical 3.2/9810 m at display precision.
- Increasing flow to 0.23561944901923448 L/s produced Re = 3000 and speed = 0.03 m/s. The transition warning appeared and the friction, pump head, power, annual energy and cost readouts cleared.
- A blank tariff cleared the bill and showed the tariff prompt while energy remained available. Entering zero restored a numeric zero bill. A zero diameter produced a diameter prompt and cleared dependent results. **Restore example** recovered the original inputs and estimates.

## Phase 3 verification · 2026-11-24

- Ran `node --test` and `node --check src/ui/app.mjs`. All 26 scientific and unit-conversion tests passed, with 0 failures and 0 skips. The UI syntax check passed.
- In the locally served comparison, the example used the same flow, length, lift, schedule and tariff for both designs. Changing diameter from 100 to 125 mm and efficiency from 75% to 80% gave displayed annual costs of 344.867 and 271.031 CU. Displayed savings of 73.8359 CU/year and payback of 13.5435 years agreed with a direct call to the model at display precision.
- Matching all design inputs gave identical table columns, zero savings and unavailable payback. With identical pipe geometry and 60% upgrade efficiency, the upgrade cost 431.084 CU/year, savings were −86.2167 CU/year and the numeric payback cleared.
- With positive savings, clearing the extra installed cost preserved savings and cleared payback. Zero extra cost gave zero years. Setting the shared tariff to zero gave two zero bills and no numeric payback.
- At 0.35 L/s with 100 and 125 mm diameters, the baseline was turbulent and the upgrade transitional. Only the supported baseline retained its bill. A zero upgrade diameter flagged the upgrade control. Both cases cleared savings and payback. **Restore example** recovered the reference comparison in the browser.

## Phase 4 public release · 2026-11-24

- Published the simulator in commit `627a9da` from the main branch root. Ran `node --test` with 26 passes, 0 failures and 0 skips. [Public simulator](https://fken2578-boop.github.io/FlowWise/)
- An anonymous HTTPS client fetched the homepage, stylesheet, favicon and all three JavaScript modules. Each returned HTTP 200 and matched its Git blob byte for byte.
- In a fresh browser tab at the public URL, the default design comparison showed 73.8359 CU/year savings and 13.5435 years of payback. In a 390 × 844 viewport, a keyboard edit changed installed cost from 1000 to 500 CU. Savings stayed constant and payback fell to 6.77177 years. Activating **Restore example** with Enter restored the original results. Content and client widths were both 375 CSS pixels.
