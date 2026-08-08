const FORM_RESPONSE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfphC9GZD2uJR6Ezv7IgX8_R7g6_JC7wOA7qeGBBVAzxBU_Dg/formResponse";

const FORM_ENTRIES = {
  firstName: "entry.1211410083",
  contact: "entry.1093468283",
  university: "entry.1721877843",
  course: "entry.1556195189",
  consent: "entry.755150101",
};

const PRODUCT_CONNECTORS = new Map([
  ["skills", "https://skillscanvas.co"],
  ["concepts", "https://conceptsnexus.co"],
  ["collab", "https://collaboard.co"],
  ["vest", "https://vestden.co"],
]);

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const rateBuckets = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeWhatsApp(value) {
  const raw = trimText(value);
  if (!raw) return "";
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) return `+234${digits.slice(1)}`;
  return `${hasPlus ? "+" : ""}${digits}`;
}

export function validateWaitlist(payload) {
  const values = {
    firstName: trimText(payload?.firstName),
    email: trimText(payload?.email).toLowerCase(),
    whatsapp: normalizeWhatsApp(payload?.whatsapp),
    university: trimText(payload?.university),
    course: trimText(payload?.course),
    microskills: trimText(payload?.microskills),
    consent: payload?.consent === true,
    website: trimText(payload?.website),
  };
  const errors = {};
  if (!values.firstName || values.firstName.length > 80) errors.firstName = "Enter a first name of 80 characters or fewer.";
  if (!/^\S+@\S+\.\S+$/.test(values.email) || values.email.length > 254) errors.email = "Enter a valid email address.";
  if (values.whatsapp && !/^\+?\d{7,15}$/.test(values.whatsapp)) errors.whatsapp = "Enter a valid WhatsApp number or leave it blank.";
  if (values.university.length < 2 || values.university.length > 120) errors.university = "Enter a university or campus of 120 characters or fewer.";
  if (values.course.length < 2 || values.course.length > 160) errors.course = "Enter a course of study of 160 characters or fewer.";
  if (values.microskills.length > 800) errors.microskills = "Choose 800 characters or fewer of microskills.";
  if (!values.consent) errors.consent = "Consent is required to join early access.";
  return { values, errors };
}

function rateLimited(request, now = Date.now()) {
  const address = request.headers.get("cf-connecting-ip");
  if (!address) return false;
  const current = rateBuckets.get(address);
  if (!current || now - current.startedAt >= RATE_LIMIT.windowMs) {
    rateBuckets.set(address, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT.max;
}

export function resetRateLimitsForTests() {
  rateBuckets.clear();
}

export async function handleWaitlist(request, fetchImpl = fetch) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Cross-origin submission blocked." }, 403);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) return json({ error: "Use application/json." }, 415);

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 413);
  if (rateLimited(request)) return json({ error: "Too many attempts. Please try again later." }, 429);

  let rawBody;
  let payload;
  try {
    rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return json({ error: "Request is too large." }, 413);
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const { values, errors } = validateWaitlist(payload);
  if (values.website) return json({ accepted: true }, 201);
  if (Object.keys(errors).length) return json({ error: "Please check the form.", errors }, 400);

  const formData = new FormData();
  formData.append(FORM_ENTRIES.firstName, values.firstName);
  formData.append(FORM_ENTRIES.contact, values.whatsapp ? `${values.email} | WhatsApp: ${values.whatsapp}` : values.email);
  formData.append(FORM_ENTRIES.university, values.university);
  const courseWithMicroskills = values.microskills ? `${values.course} | Microskills: ${values.microskills}` : values.course;
  formData.append(FORM_ENTRIES.course, courseWithMicroskills);
  formData.append(FORM_ENTRIES.consent, "I agree");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const upstream = await fetchImpl(FORM_RESPONSE_URL, {
      method: "POST",
      body: formData,
      redirect: "follow",
      signal: controller.signal,
    });
    if (!upstream.ok) return json({ error: "The waitlist service did not accept the submission." }, 502);
    return json({ accepted: true }, 201);
  } catch {
    return json({ error: "The waitlist service is temporarily unavailable." }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

function productConnectorRedirect(request) {
  if (!["GET", "HEAD"].includes(request.method)) return null;

  const incomingUrl = new URL(request.url);
  const [, connector, ...remainder] = incomingUrl.pathname.split("/");
  const canonicalOrigin = PRODUCT_CONNECTORS.get(connector);
  if (!canonicalOrigin) return null;

  // Connector aliases only: product domains remain canonical deployment origins.
  const destination = new URL(canonicalOrigin);
  destination.pathname = remainder.length ? `/${remainder.join("/")}` : "/";
  destination.search = incomingUrl.search;
  return Response.redirect(destination, 308);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/waitlist") {
      if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
      return handleWaitlist(request);
    }

    const connectorRedirect = productConnectorRedirect(request);
    if (connectorRedirect) return connectorRedirect;

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) return response;

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
