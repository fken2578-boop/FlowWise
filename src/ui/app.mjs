import { compareDesigns } from "../model/simulator.mjs";
import { litresPerSecondToM3s, millimetresToMetres, percentToFraction } from "./units.mjs";

const form = document.getElementById("design-form");
const fields = form.elements;
const readouts = document.querySelectorAll("[data-result]");
const feedback = document.getElementById("feedback");
const upgradeFeedback = document.getElementById("upgrade-feedback");
const comparisonRows = document.querySelectorAll("[data-compare]");
const baselineControls = { diameterM: fields.diameterMm, roughnessM: fields.roughnessMm, efficiency: fields.efficiencyPct };
const upgradeControls = { diameterM: fields.upgradeDiameterMm, roughnessM: fields.upgradeRoughnessMm, efficiency: fields.upgradeEfficiencyPct };
const liftShare = document.getElementById("lift-share");
const frictionShare = document.getElementById("friction-share");
const decimal = new Intl.NumberFormat("en", { maximumSignificantDigits: 6 });

const fieldMessages = {
  flowM3s: ["flowLs", "Enter a flow rate greater than zero."],
  diameterM: ["diameterMm", "Enter an inner diameter greater than zero."],
  lengthM: ["lengthM", "Enter a pipe length greater than zero."],
  roughnessM: ["roughnessMm", "Enter a wall roughness from zero to 5% of the inner diameter."],
  staticLiftM: ["staticLiftM", "Enter a static lift of zero or more."],
  efficiency: ["efficiencyPct", "Enter a pump and drive efficiency greater than 0% and at most 100%."],
  hoursPerYear: ["hoursPerYear", "Enter an operating time from 0 to 8760 hours per year."],
  tariffPerKwh: ["tariffPerKwh", "Enter an electricity tariff of zero or more."],
  investment: ["investment", "Enter an extra installed cost of zero or more."],
};

function formatResult(value) {
  if (value === null) return "—";
  if (typeof value === "string") return value[0].toUpperCase() + value.slice(1);
  const magnitude = Math.abs(value);
  if (magnitude >= 1e9 || (magnitude > 0 && magnitude < 0.0001)) return value.toExponential(4);
  return decimal.format(value);
}

function updateFeedback(result, controls, target) {
  let message = "";
  if (result.status === "invalid-input") {
    const [name, explanation] = fieldMessages[result.field];
    const control = controls[result.field] ?? fields[name];
    // A shared duty error may already point to the baseline feedback.
    if (!control.hasAttribute("aria-invalid")) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", target.id);
      message = explanation;
    }
  } else if (result.status === "transitional") {
    message = "Transitional flow (2300 ≤ Re < 4000). Friction is uncertain, so pump head, power, energy and cost are unavailable.";
  } else if (result.status === "out-of-range") {
    message = result.field === "paybackYears"
      ? "Simple payback exceeds the numerical range. Check the investment and annual savings."
      : result.reynoldsNumber > 1e8
      ? "Reynolds number exceeds the model limit of 100 million. Reduce flow or increase the diameter."
      : "These inputs exceed the numerical range. Check the values and their units.";
  }
  if (message !== target.textContent) target.textContent = message;
}

function readDesign(controls) {
  return {
    diameterM: millimetresToMetres(controls.diameterM.value),
    roughnessM: millimetresToMetres(controls.roughnessM.value),
    efficiency: percentToFraction(controls.efficiency.value),
  };
}

function describeChanges() {
  const changes = [];
  for (const [field, label, unit] of [
    ["diameterM", "Inner diameter", "mm"],
    ["roughnessM", "Wall roughness", "mm"],
    ["efficiency", "Pump and drive efficiency", "%"],
  ]) {
    const before = baselineControls[field];
    const after = upgradeControls[field];
    if (before.valueAsNumber !== after.valueAsNumber) {
      changes.push(`${label} changes from ${before.value} to ${after.value} ${unit}.`);
    }
  }
  return changes.join(" ") || "Both designs use identical pipe and pump inputs.";
}

function renderComparison(comparison) {
  for (const row of comparisonRows) {
    const key = row.dataset.compare;
    row.cells[1].textContent = formatResult(comparison.baseline[key]);
    row.cells[2].textContent = formatResult(comparison.upgrade[key]);
  }
  const savings = comparison.annualSavings;
  document.getElementById("annual-savings").textContent = formatResult(savings);
  document.getElementById("payback").textContent = formatResult(comparison.paybackYears);
  document.getElementById("payback-unit").hidden = comparison.paybackYears === null;
  document.getElementById("changes").textContent = savings === null ? "" : describeChanges();

  let verdict = "A comparison requires a supported annual cost for both designs.";
  if (savings > 0) verdict = "The upgrade costs less to run.";
  if (savings === 0) verdict = "No positive annual savings. Both designs have the same annual electricity cost.";
  if (savings < 0) verdict = "No positive annual savings. The upgrade costs more to run.";
  const verdictNode = document.getElementById("verdict");
  if (verdictNode.textContent !== verdict) verdictNode.textContent = verdict;
}

function render() {
  const duty = {
    flowM3s: litresPerSecondToM3s(fields.flowLs.value),
    lengthM: fields.lengthM.valueAsNumber,
    staticLiftM: fields.staticLiftM.valueAsNumber,
    hoursPerYear: fields.hoursPerYear.valueAsNumber,
    tariffPerKwh: fields.tariffPerKwh.valueAsNumber,
  };
  const comparison = compareDesigns(duty, readDesign(baselineControls), readDesign(upgradeControls), fields.investment.valueAsNumber);
  const result = comparison.baseline;
  const staticLiftM = Number.isFinite(duty.staticLiftM) && duty.staticLiftM >= 0 ? duty.staticLiftM : null;
  const values = { ...result, staticLiftM };
  for (const node of readouts) node.textContent = formatResult(values[node.dataset.result]);

  const head = result.pumpHeadM;
  liftShare.style.width = head === null ? "0%" : `${100 * (staticLiftM / head)}%`;
  frictionShare.style.width = head === null ? "0%" : `${100 * (result.frictionHeadM / head)}%`;
  for (const control of form.querySelectorAll("[aria-invalid]")) {
    control.removeAttribute("aria-invalid");
    control.removeAttribute("aria-describedby");
  }
  updateFeedback(result, baselineControls, feedback);
  const upgradeIssue = comparison.field === "investment" || comparison.field === "paybackYears"
    ? comparison : comparison.upgrade;
  updateFeedback(upgradeIssue, upgradeControls, upgradeFeedback);
  renderComparison(comparison);
}

form.addEventListener("input", render);
form.addEventListener("submit", event => event.preventDefault());
// Native reset restores default values after dispatching the reset event.
form.addEventListener("reset", () => requestAnimationFrame(render));
render();
