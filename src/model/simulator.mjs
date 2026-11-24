// SI quantities throughout. Fixed water properties are defined in PROJECT_SPEC.md.
const DENSITY = 1000;
const DYNAMIC_VISCOSITY = 0.001;
const GRAVITY = 9.81;
const MAX_REYNOLDS = 1e8;

const emptyEnergy = {
  hydraulicPowerW: null,
  electricalPowerW: null,
  annualEnergyKwh: null,
  annualCost: null,
};

// A calculation only publishes a value after it passes its checks. If a later
// stage fails, the caller still has the independent results computed so far.
class ModelIssue extends Error {
  constructor(status, field) {
    super(field);
    this.status = status;
    this.field = field;
  }
}

function evaluate(result, calculate) {
  try {
    calculate(result);
    return { ...result, status: "ok", field: null };
  } catch (error) {
    if (!(error instanceof ModelIssue)) throw error;
    return { ...result, status: error.status, field: error.field };
  }
}

function input(value, field, { positive = false, max = Infinity } = {}) {
  if (!Number.isFinite(value) || (positive ? value <= 0 : value < 0) || value > max) {
    throw new ModelIssue("invalid-input", field);
  }
  return value;
}

function computed(value, field, allowZero = false) {
  if (!Number.isFinite(value) || (value === 0 && !allowZero)) {
    throw new ModelIssue("out-of-range", field);
  }
  return value;
}

export function classifyFlow(reynoldsNumber) {
  if (!Number.isFinite(reynoldsNumber) || reynoldsNumber <= 0 || reynoldsNumber > MAX_REYNOLDS) return null;
  if (reynoldsNumber < 2300) return "laminar";
  if (reynoldsNumber < 4000) return "transitional";
  return "turbulent";
}

function calculateHydraulics(duty, design) {
  return evaluate({
    flowM3s: null,
    areaM2: null,
    speedMs: null,
    reynoldsNumber: null,
    regime: null,
    relativeRoughness: null,
    darcyFactor: null,
    frictionHeadM: null,
    frictionPressurePa: null,
    pumpHeadM: null,
  }, result => {
    result.flowM3s = input(duty?.flowM3s, "flowM3s", { positive: true });
    const diameter = input(design?.diameterM, "diameterM", { positive: true });
    result.areaM2 = computed((Math.PI / 4) * diameter * diameter, "areaM2");
    result.speedMs = computed(result.flowM3s / result.areaM2, "speedMs");
    result.reynoldsNumber = computed(result.speedMs * diameter * (DENSITY / DYNAMIC_VISCOSITY), "reynoldsNumber");
    result.regime = classifyFlow(result.reynoldsNumber);
    if (result.regime === null) throw new ModelIssue("out-of-range", "reynoldsNumber");

    const roughness = input(design?.roughnessM, "roughnessM");
    const ratio = computed(roughness / diameter, "relativeRoughness", roughness === 0);
    if (ratio > 0.05) throw new ModelIssue("invalid-input", "roughnessM");
    result.relativeRoughness = ratio;
    const length = input(duty?.lengthM, "lengthM", { positive: true });
    const lift = input(duty?.staticLiftM, "staticLiftM");
    if (result.regime === "transitional") throw new ModelIssue("transitional", "reynoldsNumber");

    let factor;
    if (result.regime === "laminar") {
      factor = 64 / result.reynoldsNumber;
    } else {
      const argument = (ratio / 3.7) ** 1.11 + 6.9 / result.reynoldsNumber;
      factor = 1 / (-1.8 * Math.log10(argument)) ** 2;
    }
    result.darcyFactor = computed(factor, "darcyFactor");
    result.frictionHeadM = computed(factor * (length / diameter) * result.speedMs ** 2 / (2 * GRAVITY), "frictionHeadM");
    result.frictionPressurePa = computed(DENSITY * GRAVITY * result.frictionHeadM, "frictionPressurePa");
    result.pumpHeadM = computed(lift + result.frictionHeadM, "pumpHeadM");
  });
}

export function calculateEnergy(inputs) {
  return evaluate({ ...emptyEnergy }, result => {
    const flow = input(inputs?.flowM3s, "flowM3s", { positive: true });
    const head = input(inputs?.pumpHeadM, "pumpHeadM", { positive: true });
    result.hydraulicPowerW = computed(DENSITY * GRAVITY * flow * head, "hydraulicPowerW");
    const efficiency = input(inputs?.efficiency, "efficiency", { positive: true, max: 1 });
    result.electricalPowerW = computed(result.hydraulicPowerW / efficiency, "electricalPowerW");
    const hours = input(inputs?.hoursPerYear, "hoursPerYear", { max: 8760 });
    result.annualEnergyKwh = computed((result.electricalPowerW / 1000) * hours, "annualEnergyKwh", hours === 0);
    const tariff = input(inputs?.tariffPerKwh, "tariffPerKwh");
    result.annualCost = computed(result.annualEnergyKwh * tariff, "annualCost", hours === 0 || tariff === 0);
  });
}

export function calculateDesign(duty, design) {
  const hydraulics = calculateHydraulics(duty, design);
  if (hydraulics.status !== "ok") return { ...hydraulics, ...emptyEnergy };
  const energy = calculateEnergy({
    flowM3s: hydraulics.flowM3s,
    pumpHeadM: hydraulics.pumpHeadM,
    efficiency: design.efficiency,
    hoursPerYear: duty.hoursPerYear,
    tariffPerKwh: duty.tariffPerKwh,
  });
  return { ...hydraulics, ...energy };
}

export function calculatePayback(baselineAnnualCost, upgradeAnnualCost, investment) {
  return evaluate({ annualSavings: null, paybackYears: null }, result => {
    const baseline = input(baselineAnnualCost, "baselineAnnualCost");
    const upgrade = input(upgradeAnnualCost, "upgradeAnnualCost");
    result.annualSavings = baseline - upgrade;
    const cost = input(investment, "investment");
    if (result.annualSavings <= 0) throw new ModelIssue("no-positive-savings", "annualSavings");
    result.paybackYears = computed(cost / result.annualSavings, "paybackYears", cost === 0);
  });
}

export function compareDesigns(duty, baselineDesign, upgradeDesign, investment) {
  const baseline = calculateDesign(duty, baselineDesign);
  const upgrade = calculateDesign(duty, upgradeDesign);
  if (baseline.status !== "ok" || upgrade.status !== "ok") {
    return { baseline, upgrade, status: "unavailable", field: null, annualSavings: null, paybackYears: null };
  }
  return { baseline, upgrade, ...calculatePayback(baseline.annualCost, upgrade.annualCost, investment) };
}
