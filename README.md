# FlowWise

Interactive Fluid Dynamics & Energy Optimization Simulator for the STEM Innovation Challenge 2026 Hackathon.

[Open the live simulator](https://fken2578-boop.github.io/FlowWise/) · [Jump to the upgrade comparison](https://fken2578-boop.github.io/FlowWise/#comparison)

FlowWise estimates pump head, electrical power, annual energy and annual cost for a baseline pipe design and a proposed upgrade. Editing any input recalculates both designs in the browser. The baseline head breakdown shows how much comes from static lift and how much comes from pipe friction.

## Run the preview

From PowerShell, use the installed Python standard library.

```powershell
cd E:\FlowWise
python -B -m http.server 8000 --bind 127.0.0.1
```

Open [the local simulator](http://127.0.0.1:8000/). The initial values are an illustrative design. Enter flow in L/s, diameter and wall roughness in mm, efficiency in percent, and tariff in your own currency units (CU) per kWh. Use **Restore example** to reset the form. Expand **Model assumptions** to see the regime limits. Press Ctrl+C in the terminal to stop the server. If port 8000 is occupied, use 8001 in both the command and the URL.

To reproduce the laminar benchmark, start with **Restore example**, set flow to 0.07853981633974483 L/s, wall roughness to 0 mm and static lift to 0 m. The page should show Re of 1000, friction pressure loss of 3.2 Pa and friction head of 0.000326198 m at display precision. Increase flow to 0.23561944901923448 L/s to see the transition warning and the dependent values clear.

## Compare two designs

Choose **Compare an upgrade** to edit the upgrade diameter, roughness, pump and drive efficiency, and extra installed cost. Flow rate, pipe length, static lift, hours and tariff come from the baseline operating inputs. The comparison shows which design inputs changed, both annual bills, signed annual savings and simple payback.

The example raises the diameter from 100 to 125 mm and efficiency from 75% to 80%, with an illustrative extra installed cost of 1000 CU. At the initial operating duty, the model estimates savings of 73.8359 CU/year and a payback of 13.5435 years. To see an equivalent design, set the upgrade diameter to 100 mm and efficiency to 75%. Then try 60% efficiency to see a negative saving. Zero or negative savings leave the payback unavailable. **Restore example** resets both designs and the installed cost.

## Repository guide

| Path | Purpose |
| --- | --- |
| `index.html`, `styles/site.css` | Page content and responsive layout |
| `src/ui/app.mjs` | Browser-only presentation logic |
| [src/model/simulator.mjs](./src/model/simulator.mjs) | Pure SI calculations for individual designs and same-duty comparisons |
| [src/ui/units.mjs](./src/ui/units.mjs) | Pure display-unit conversions for flow, dimensions and efficiency |
| [PROJECT_SPEC.md](./PROJECT_SPEC.md) | Engineering assumptions, equations and supported inputs |
| [tests/README.md](./tests/README.md) | Scientific benchmarks, boundary cases and tolerances |
| [TASKS.md](./TASKS.md) | Phase gates, time budget and verification record |
| [AI_USAGE.md](./AI_USAGE.md) | AI contributions and review status |

## Run the scientific checks

From the project directory, run `node --test`. Node discovers the test files under `tests/`. The tests exercise the same ES module that the browser can import.

To try the laminar benchmark directly, run this command from the project directory.

```powershell
node --input-type=module -e "import { calculateDesign } from './src/model/simulator.mjs'; console.log(calculateDesign({ flowM3s: Math.PI/40000, lengthM: 100, staticLiftM: 0, hoursPerYear: 2000, tariffPerKwh: 0.2 }, { diameterM: 0.1, roughnessM: 0, efficiency: 0.75 }));"
```

Look for a Reynolds number near 1000 and a friction pressure loss near 3.2 Pa. The same module exports `compareDesigns(duty, baselineDesign, upgradeDesign, investment)`. Pass the common duty once and give each design its own diameter, roughness and combined efficiency.

## Deployment

GitHub Pages serves this repository from **main → /(root)**. Push a reviewed update to that branch to trigger publication. The site uses relative paths and an empty `.nojekyll` file for plain static publishing. [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
