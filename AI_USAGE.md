# AI-assisted development

## Phase 0 · 2026-11-24

The developer supplied the project goal, constraints and phase boundary. OpenAI Codex inspected the local environment, initialized Git, authored the English page scaffold and project documents, and prepared the scientific test plan. Codex proposed fixed water properties, a combined pump/drive efficiency, a common-duty comparison and a transition interval that withholds dependent results. These are documented design choices pending developer review.

Codex consulted Lund University's pipe-flow laboratory notes for the Darcy and Haaland equations and GitHub's Pages documentation for the branch publishing procedure. Links appear beside the relevant material. The analytical examples are proposed test fixtures. The project contains no measured performance data or experimental validation.

See [the delivery record](./TASKS.md) for checks actually performed. Human technical review and competition disclosure review are pending. For each later phase, append the tool used, its actual contributions, the checks performed and any corrections made by the developer.

## Phase 1 · 2026-11-24

The developer authorized the calculation phase. OpenAI Codex implemented the SI model, validation, energy and payback functions, display-unit adapters and automated tests. Codex used the Phase 0 analytical fixtures and added a rough-pipe Haaland case with a known logarithm. A separate test uses Colebrook bisection to check the approximation. Codex ran the suite and the README example, updated the preview status and recorded the observed outcomes in [TASKS.md](./TASKS.md).

The checks compare software output with equations and analytical examples. Experimental validation and independent human review are pending.

## Phase 2 · 2026-11-24

OpenAI Codex connected the English single-design form to the Phase 1 model and unit adapters, added the pump head breakdown, and implemented feedback for unavailable results. Codex chose illustrative starting inputs, including a tariff of 0.20 currency units/kWh. This value is an example for the form.

Codex exercised the running page with the documented laminar and transition fixtures, invalid diameter, blank and zero tariffs, and example reset. It reran the Node suite and recorded the outcomes in [TASKS.md](./TASKS.md). Browser observations were made on the local site.

## Phase 3 · 2026-11-24

The developer requested the design comparison phase. OpenAI Codex connected the comparison view to the existing model, added per-design input feedback and displayed signed savings and simple payback. Codex selected an illustrative upgrade with a 125 mm diameter, 80% combined efficiency and an extra installed cost of 1000 CU.

Codex compared the displayed example with a direct Node call and exercised equivalent designs, higher operating cost, zero and missing investment, a shared zero tariff, transitional flow and an invalid upgrade diameter in the local browser. The model estimates and actual verification outcomes are recorded in [TASKS.md](./TASKS.md).

## Release preparation · 2026-11-24

The developer selected the GitHub repository and authorized publication of the source and the Pages site. Codex connected the local checkout to the repository, preserved its initial README commit, and reran the 26 automated tests before preparing the source release.

Codex published the project using a deploy key scoped to FlowWise and enabled branch-based Pages publishing. It verified the published runtime files against Git, exercised the public comparison with keyboard input in a narrow viewport and added the live link and observed results to the release notes.
