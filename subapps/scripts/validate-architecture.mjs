import { readFile } from "node:fs/promises";

const base = new URL("../contracts/events/", import.meta.url);
const [catalog, envelope] = await Promise.all([
  readFile(new URL("catalog.v1.json", base), "utf8").then(JSON.parse),
  readFile(new URL("event-envelope.schema.json", base), "utf8").then(JSON.parse),
]);

const failures = [];
const products = new Set(catalog.products ?? []);
const eventTypes = new Set();

if (catalog.catalog_version !== "1.0.0") failures.push("catalog_version must be 1.0.0");
if (envelope.properties?.specversion?.const !== "1.0") failures.push("event envelope must use CloudEvents specversion 1.0");

for (const event of catalog.events ?? []) {
  if (!/^ai\.fixars\.[a-z0-9.]+\.v[1-9][0-9]*$/.test(event.type ?? "")) {
    failures.push(`invalid or unversioned event type: ${event.type}`);
  }
  if (eventTypes.has(event.type)) failures.push(`duplicate event type: ${event.type}`);
  eventTypes.add(event.type);
  if (!products.has(event.producer)) failures.push(`unknown producer for ${event.type}: ${event.producer}`);
  if (!Array.isArray(event.consumers) || event.consumers.length === 0) {
    failures.push(`event has no consumers: ${event.type}`);
  }
  for (const consumer of event.consumers ?? []) {
    if (!products.has(consumer)) failures.push(`unknown consumer for ${event.type}: ${consumer}`);
  }
  if (!event.description) failures.push(`event has no description: ${event.type}`);
}

// A cross-product event may request verification, but it must never be wired
// directly to a payment, position, payout, or escrow-release consumer.
const releaseEvent = catalog.events?.find((event) => event.type === "ai.fixars.vest.escrow.release.requested.v1");
if (!releaseEvent || releaseEvent.consumers.join(",") !== "vest-den-verification") {
  failures.push("escrow release requests must route only to vest-den-verification");
}

if (failures.length) {
  console.error("Architecture contract validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Architecture contracts valid: ${catalog.events.length} versioned events across ${products.size} bounded products/services.`);
