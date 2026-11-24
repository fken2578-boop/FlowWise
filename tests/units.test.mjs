import assert from "node:assert/strict";
import test from "node:test";
import { litresPerSecondToM3s, millimetresToMetres, percentToFraction } from "../src/ui/units.mjs";

test("display units convert to the model's SI inputs", () => {
  assert.equal(litresPerSecondToM3s(" 10 "), 0.01);
  assert.equal(millimetresToMetres(100), 0.1);
  assert.equal(percentToFraction("75"), 0.75);
  assert.equal(litresPerSecondToM3s("1e1"), 0.01);
  assert.equal(millimetresToMetres("0"), 0);
});

test("empty, non-decimal and nonfinite form values stay unavailable", () => {
  for (const value of ["", "  ", "12 mm", "0x10", "1e999", NaN, Infinity, null, undefined, true]) {
    for (const convert of [litresPerSecondToM3s, millimetresToMetres, percentToFraction]) {
      assert.equal(convert(value), null);
    }
  }
});
