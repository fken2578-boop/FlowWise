import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDesign, calculateEnergy, calculatePayback, classifyFlow, compareDesigns,
} from "../src/model/simulator.mjs";

const duty = Object.freeze({
  flowM3s: Math.PI / 40000, lengthM: 100, staticLiftM: 0, hoursPerYear: 2000, tariffPerKwh: 0.2,
});
const pipe = Object.freeze({ diameterM: 0.1, roughnessM: 0, efficiency: 0.75 });
const energyInputs = { flowM3s: 0.01, pumpHeadM: 10, efficiency: 0.75, hoursPerYear: 2000, tariffPerKwh: 0.2 };
const dependentFields = [
  "darcyFactor", "frictionHeadM", "frictionPressurePa", "pumpHeadM",
  "hydraulicPowerW", "electricalPowerW", "annualEnergyKwh", "annualCost",
];

function near(actual, expected) {
  assert.ok(Number.isFinite(actual), `Expected a finite number, received ${actual}`);
  const tolerance = Math.max(1e-12, 1e-9 * Math.abs(expected));
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
}

test("laminar pipe agrees with the Hagen–Poiseuille pressure drop", () => {
  const result = calculateDesign(duty, pipe);
  assert.equal(result.status, "ok");
  assert.equal(result.regime, "laminar");
  near(result.areaM2, Math.PI / 400);
  near(result.speedMs, 0.01);
  near(result.reynoldsNumber, 1000);
  near(result.darcyFactor, 0.064);
  near(result.frictionPressurePa, 3.2);
  near(result.frictionHeadM, 3.2 / 9810);
  near(result.pumpHeadM, 3.2 / 9810);
});

test("regime boundaries use the unrounded Reynolds number", () => {
  for (const [re, regime] of [
    [2299.99, "laminar"], [2300, "transitional"], [3999.99, "transitional"],
    [4000, "turbulent"], [1e8, "turbulent"], [1e8 + 1, null], [0, null], [NaN, null],
  ]) assert.equal(classifyFlow(re), regime);
});

test("transition retains flow and geometry and suppresses dependent quantities", () => {
  const flowM3s = 3 * duty.flowM3s;
  const result = calculateDesign({ ...duty, flowM3s }, pipe);
  assert.equal(result.status, "transitional");
  assert.equal(result.regime, "transitional");
  near(result.flowM3s, flowM3s);
  near(result.speedMs, 0.03);
  near(result.reynoldsNumber, 3000);
  for (const key of dependentFields) assert.equal(result[key], null, key);
});

test("Re beyond the supported range suppresses the friction and energy estimates", () => {
  const result = calculateDesign({ ...duty, flowM3s: 10 }, pipe);
  assert.equal(result.status, "out-of-range");
  assert.equal(result.field, "reynoldsNumber");
  assert.ok(result.reynoldsNumber > 1e8);
  for (const key of dependentFields) assert.equal(result[key], null, key);
});

test("smooth turbulent pipe gives the closed-form Haaland fixture", () => {
  const result = calculateDesign({ ...duty, flowM3s: 69 * duty.flowM3s }, pipe);
  assert.equal(result.status, "ok");
  assert.equal(result.regime, "turbulent");
  near(result.reynoldsNumber, 69000);
  near(result.darcyFactor, 1 / 7.2 ** 2);
});

test("rough turbulent pipe agrees with an independent iterative Colebrook solution", () => {
  const residual = f => 1 / Math.sqrt(f) + 2 * Math.log10(0.001 / 3.7 + 2.51 / (100000 * Math.sqrt(f)));
  let low = 0.01;
  let high = 0.05;
  assert.ok(residual(low) > 0 && residual(high) < 0);
  for (let i = 0; i < 64; i++) {
    const mid = (low + high) / 2;
    if (residual(mid) > 0) low = mid;
    else high = mid;
  }
  const reference = (low + high) / 2;
  assert.ok(Math.abs(residual(reference)) < 1e-10);
  const turbulentDuty = { ...duty, flowM3s: 100 * duty.flowM3s };
  const rough = calculateDesign(turbulentDuty, { ...pipe, roughnessM: 0.0001 });
  const smooth = calculateDesign(turbulentDuty, pipe);
  assert.equal(rough.status, "ok");
  near(rough.reynoldsNumber, 100000);
  near(rough.relativeRoughness, 0.001);
  assert.ok(Math.abs(rough.darcyFactor - reference) / reference < 0.02);
  assert.ok(rough.frictionHeadM > smooth.frictionHeadM);
});

test("nonzero roughness and the viscous term both enter the Haaland logarithm", () => {
  // Choose roughness so the roughness term is 0.0009. At Re = 69000
  // the viscous term adds 0.0001, making the base-ten logarithm exactly -3.
  const roughnessM = pipe.diameterM * 3.7 * 0.0009 ** (1 / 1.11);
  const result = calculateDesign({ ...duty, flowM3s: 69 * duty.flowM3s }, { ...pipe, roughnessM });
  assert.equal(result.status, "ok");
  near(result.darcyFactor, 1 / 5.4 ** 2);
});

test("length scales friction and static lift independently raises head and power", () => {
  const flat = calculateDesign(duty, pipe);
  const long = calculateDesign({ ...duty, lengthM: 200 }, pipe);
  const uphill = calculateDesign({ ...duty, staticLiftM: 5 }, pipe);
  near(long.frictionHeadM, 2 * flat.frictionHeadM);
  near(uphill.frictionHeadM, flat.frictionHeadM);
  near(uphill.pumpHeadM - flat.pumpHeadM, 5);
  near(uphill.electricalPowerW - flat.electricalPowerW, 9810 * duty.flowM3s * 5 / 0.75);
});

test("prescribed head gives the benchmark power, annual energy and bill", () => {
  const result = calculateEnergy(energyInputs);
  assert.equal(result.status, "ok");
  near(result.hydraulicPowerW, 981);
  near(result.electricalPowerW, 1308);
  near(result.annualEnergyKwh, 2616);
  near(result.annualCost, 523.2);
});

test("accepts the specified limits on roughness, efficiency and annual hours", () => {
  const result = calculateDesign({ ...duty, hoursPerYear: 8760 }, { diameterM: 1, roughnessM: 0.05, efficiency: 1 });
  assert.equal(result.status, "ok");
  near(result.relativeRoughness, 0.05);
  near(result.electricalPowerW, result.hydraulicPowerW);
  near(result.annualEnergyKwh, result.electricalPowerW * 8.76);
});

for (const [field, invalidValues] of Object.entries({
  flowM3s: [0, -1, undefined, "", NaN, Infinity, "0.01"],
  lengthM: [0, -1], staticLiftM: [-1], hoursPerYear: [-1, 8760.1], tariffPerKwh: [-1],
  diameterM: [0, -1], roughnessM: [-1, 0.006], efficiency: [0, -1, 1.01, null],
})) {
  test(`invalid ${field} blocks the dependent result`, () => {
    for (const value of invalidValues) {
      const shared = field in duty ? { ...duty, [field]: value } : duty;
      const design = field in pipe ? { ...pipe, [field]: value } : pipe;
      const result = calculateDesign(shared, design);
      assert.equal(result.status, "invalid-input");
      assert.equal(result.field, field);
      assert.equal(result.annualCost, null);
    }
  });
}

test("invalid tariff leaves independently computed power and energy available", () => {
  const result = calculateEnergy({ ...energyInputs, tariffPerKwh: -1 });
  near(result.electricalPowerW, 1308);
  near(result.annualEnergyKwh, 2616);
  assert.equal(result.annualCost, null);
});

test("finite inputs causing numerical overflow or underflow return a status", () => {
  for (const diameterM of [Number.MAX_VALUE, Number.MIN_VALUE]) {
    const result = calculateDesign(duty, { ...pipe, diameterM });
    assert.equal(result.status, "out-of-range");
    assert.equal(result.field, "areaM2");
    assert.equal(result.areaM2, null);
    assert.equal(result.annualCost, null);
  }
  const result = calculateEnergy({ ...energyInputs, tariffPerKwh: Number.MAX_VALUE });
  assert.equal(result.status, "out-of-range");
  assert.equal(result.annualCost, null);
  const payback = calculatePayback(1e-200, 0, 1e200);
  assert.equal(payback.status, "out-of-range");
  assert.equal(payback.paybackYears, null);
});

test("positive, negative and zero savings have distinct payback outcomes", () => {
  const better = calculatePayback(600, 400, 1000);
  assert.equal(better.status, "ok");
  near(better.annualSavings, 200);
  near(better.paybackYears, 5);
  for (const [bill, expected] of [[600, -200], [400, 0]]) {
    const poorer = calculatePayback(400, bill, 1000);
    assert.equal(poorer.status, "no-positive-savings");
    assert.equal(poorer.annualSavings, expected);
    assert.equal(poorer.paybackYears, null);
  }
  const free = calculatePayback(600, 400, 0);
  assert.equal(free.status, "ok");
  assert.equal(free.paybackYears, 0);
  const invalid = calculatePayback(600, 400, -1);
  assert.equal(invalid.status, "invalid-input");
  assert.equal(invalid.paybackYears, null);
});

test("comparison uses one common duty and carries power savings into payback", () => {
  const result = compareDesigns(duty, pipe, { ...pipe, efficiency: 1, flowM3s: 1 }, 100);
  assert.equal(result.status, "ok");
  near(result.upgrade.hydraulicPowerW, result.baseline.hydraulicPowerW);
  near(result.upgrade.electricalPowerW, 0.75 * result.baseline.electricalPowerW);
  near(result.annualSavings, 0.25 * result.baseline.annualCost);
  near(result.paybackYears, 100 / result.annualSavings);
  const identical = compareDesigns(duty, pipe, pipe, 100);
  assert.equal(identical.status, "no-positive-savings");
  assert.equal(identical.annualSavings, 0);
  assert.equal(identical.paybackYears, null);
});

test("zero operating time or tariff gives zero savings and unavailable payback", () => {
  for (const key of ["hoursPerYear", "tariffPerKwh"]) {
    const result = compareDesigns({ ...duty, [key]: 0 }, pipe, { ...pipe, efficiency: 1 }, 100);
    assert.equal(result.baseline.status, "ok");
    if (key === "hoursPerYear") assert.equal(result.baseline.annualEnergyKwh, 0);
    else assert.ok(result.baseline.annualEnergyKwh > 0);
    assert.equal(result.baseline.annualCost, 0);
    assert.equal(result.annualSavings, 0);
    assert.equal(result.status, "no-positive-savings");
    assert.equal(result.paybackYears, null);
  }
});

test("one unavailable design blocks savings in either comparison position", () => {
  for (const [diameterM, status] of [[pipe.diameterM / 3, "transitional"], [0, "invalid-input"]]) {
    const other = { ...pipe, diameterM };
    for (const [left, right] of [[pipe, other], [other, pipe]]) {
      const result = compareDesigns(duty, left, right, 1000);
      assert.equal(result.baseline.status, left === pipe ? "ok" : status);
      assert.equal(result.upgrade.status, right === pipe ? "ok" : status);
      assert.equal(result.status, "unavailable");
      assert.equal(result.annualSavings, null);
      assert.equal(result.paybackYears, null);
    }
  }
});
