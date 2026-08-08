const PRODUCT_CONNECTORS = new Map([
  ["skills", "https://skillscanvas.co"],
  ["concepts", "https://conceptsnexus.co"],
  ["collab", "https://collaboard.co"],
  ["vest", "https://vestden.co"],
]);

function productConnectorRedirect(request) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return null;
  }

  const incomingUrl = new URL(request.url);
  const [, connector, ...remainder] = incomingUrl.pathname.split("/");
  const canonicalOrigin = PRODUCT_CONNECTORS.get(connector);

  if (!canonicalOrigin) {
    return null;
  }

  // These server-side connector paths are aliases only. Product domains remain
  // canonical deployment origins; the suffix and query string cross intact.
  const destination = new URL(canonicalOrigin);
  destination.pathname = remainder.length ? `/${remainder.join("/")}` : "/";
  destination.search = incomingUrl.search;
  return Response.redirect(destination, 308);
}

export default {
  async fetch(request, env) {
    const connectorRedirect = productConnectorRedirect(request);
    if (connectorRedirect) {
      return connectorRedirect;
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
