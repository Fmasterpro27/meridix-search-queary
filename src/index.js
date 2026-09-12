export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname !== "/suggest") {
      return new Response("Not found", { status: 404, headers: corsHeaders() });
    }

    const query = (url.searchParams.get("q") || "").trim();

    if (!query) {
      return jsonResponse({ query: "", suggestions: [] });
    }

    // the same thing.
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const suggestions = await getSuggestions(query);

    const response = jsonResponse({ query, suggestions });
    response.headers.set("Cache-Control", "public, max-age=300");

    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
};

async function getSuggestions(query) {
  const [google, ddg, wiki] = await Promise.allSettled([
    fetchGoogle(query),
    fetchDuckDuckGo(query),
    fetchWikipedia(query),
  ]);

  const lists = [];
  if (google.status === "fulfilled") lists.push(google.value);
  if (ddg.status === "fulfilled") lists.push(ddg.value);
  if (wiki.status === "fulfilled") lists.push(wiki.value);

  const scores = new Map();
  const firstSeenOrder = [];

  lists.forEach((list) => {
    list.forEach((phrase, index) => {
      const key = phrase.toLowerCase().trim();
      if (!key) return;

      if (!scores.has(key)) {
        scores.set(key, { phrase, agreement: 0, positionBonus: 0 });
        firstSeenOrder.push(key);
      }

      const entry = scores.get(key);
      entry.agreement += 1;
      entry.positionBonus += Math.max(0, 8 - index);
    });
  });

  const ranked = firstSeenOrder
    .map((key) => scores.get(key))
    .sort((a, b) => {
      if (b.agreement !== a.agreement) return b.agreement - a.agreement;
      return b.positionBonus - a.positionBonus;
    })
    .slice(0, 8)
    .map((entry) => entry.phrase);

  return ranked;
}

async function fetchGoogle(query) {
  const res = await fetch(
    `https://www.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MeridixSuggest/1.0)" },
    },
  );

  if (!res.ok) throw new Error("Google suggest request failed");

  const data = await res.json();

  return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
}

async function fetchDuckDuckGo(query) {
  const res = await fetch(
    `https://duckduckgo.com/ac/?type=list&q=${encodeURIComponent(query)}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MeridixSuggest/1.0)" },
    },
  );

  if (!res.ok) throw new Error("DuckDuckGo suggest request failed");

  const data = await res.json();

  return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
}

async function fetchWikipedia(query) {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=5&search=${encodeURIComponent(query)}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MeridixSuggest/1.0)" },
    },
  );

  if (!res.ok) throw new Error("Wikipedia opensearch request failed");

  const data = await res.json();

  // Shape: ["query", ["title1", "title2", ...], [...descriptions], [...urls]]
  return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}
