import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyCourse,
  normalizeCourse,
  profileForFamily,
  rankCourseMatches,
} from "../src/courseClassifier.js";

test("normalizes case, punctuation and common degree awards", () => {
  assert.equal(normalizeCourse("B.Sc. (Hons) COMPUTER SCIENCE"), "computer");
  assert.equal(normalizeCourse("Bachelor of Engineering - Mechanical Engineering"), "engineering mechanical engineering");
});

test("matches common courses without relying on case", () => {
  const result = classifyCourse("bsc COMPUTER SCIENCE");
  assert.equal(result.status, "matched");
  assert.equal(result.families[0].id, "computing");
  assert.equal(Object.values(result.skills).flat().length, 6);
});

test("handles a minor spelling error", () => {
  const result = classifyCourse("Computr Science");
  assert.equal(result.status, "matched");
  assert.equal(result.families[0].id, "computing");
});

test("merges two distinct families for a joint course", () => {
  const result = classifyCourse("Computer Science and Economics");
  assert.equal(result.status, "matched");
  assert.deepEqual(result.families.map((family) => family.id), ["computing", "business-economics"]);
  assert.equal(new Set(Object.values(result.skills).flat()).size, 6);
});

test("returns ranked choices instead of inventing a generic profile", () => {
  const result = classifyCourse("media policy");
  assert.equal(result.status, "ambiguous");
  assert.ok(result.suggestions.length <= 3);
});

test("asks for a family when the title is unknown", () => {
  const result = classifyCourse("quantum basket weaving");
  assert.equal(result.status, "unknown");
  assert.equal(result.families.length, 12);
});

test("can build a verified family choice without changing the typed course", () => {
  const result = profileForFamily("built-environment", "Property development practice");
  assert.equal(result.course, "Property development practice");
  assert.equal(result.families[0].id, "built-environment");
});

test("ranks exact aliases above approximate matches", () => {
  const [top] = rankCourseMatches("Microbiology");
  assert.equal(top.id, "life-health");
  assert.equal(top.score, 1);
});
