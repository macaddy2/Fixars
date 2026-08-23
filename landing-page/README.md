# Fixars early-access landing page

This folder contains the deployable Fixars landing page and waitlist experience.
It is intentionally isolated from the broader Fixars platform in the repository
root so the waitlist can be deployed on its own.

## Live waitlist

- Landing page: <https://fixars-waitlist.trucycle01.chatgpt.site>
- Waitlist form: <https://docs.google.com/forms/d/e/1FAIpQLSfphC9GZD2uJR6Ezv7IgX8_R7g6_JC7wOA7qeGBBVAzxBU_Dg/viewform>
- Planned custom domain: `fixars.ai` (DNS verification is still pending)

The public form collects:

- First name (required)
- Email address (required)
- WhatsApp number (optional)
- University or campus (required)
- Course of study (required)
- Explicit early-access consent (required)

The browser submits JSON to `POST /api/waitlist`. The server validates the
request, applies basic bot and rate-limit controls, and only reports success
after the existing Google Form accepts it. Responses remain organised in the
form owner's linked private Google Sheet. No submissions or credentials are
stored in this repository.

Waitlist data is intended only for pilot planning and contact. Public copy sets
a maximum 12-month retention period, with earlier removal when the pilot closes
or the person withdraws through `privacy@fixars.ai`. The mailbox must be verified
before a production release.

## Course taster

`src/courseClassifier.js` contains the pure course-title classifier. It removes
common degree awards, handles aliases, small spelling differences and joint
courses, and ranks 12 broad course families. Strong matches generate a grouped
skill preview; ambiguous and unknown titles require the person to choose a
family instead of presenting a generic result as fact. Every preview is labelled
as a course-title-only suggestion that still needs evidence.

## Local development

```bash
npm ci
npm run dev
```

## Verification

```bash
npm run build
npm run test:sites
```

The test suite covers course matching, request validation, upstream failure,
same-origin enforcement, body limits, throttling, static assets and SPA routing.

## Deployment scope

The `.openai/hosting.json` file links this subproject to the existing Fixars
Sites project. Deployments from this folder publish only the landing page and
waitlist; they do not publish the broader application in the repository root.
