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
- Email address or phone number (required)
- University (optional)
- Discipline or area of study (optional)
- Consent (required)

Responses are organised in the form owner's linked private Google Sheet. No
waitlist submissions or credentials are stored in this repository.

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

## Deployment scope

The `.openai/hosting.json` file links this subproject to the existing Fixars
Sites project. Deployments from this folder publish only the landing page and
waitlist; they do not publish the broader application in the repository root.
