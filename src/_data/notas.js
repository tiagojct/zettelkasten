const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const NOTAS_DIR = path.join(__dirname, "..", "notas");

function extractLinks(body) {
  const links = [];
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    links.push(m[1].trim());
  }
  return links;
}

module.exports = function () {
  if (!fs.existsSync(NOTAS_DIR)) return [];

  const files = fs.readdirSync(NOTAS_DIR).filter((f) => f.endsWith(".md"));

  const notas = files
    .map((file) => {
      const raw = fs.readFileSync(path.join(NOTAS_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      const links = extractLinks(content);

      return {
        fileSlug: file.replace(/\.md$/, ""),
        id: data.id || file.replace(/\.md$/, ""),
        title: data.title || data.id || file.replace(/\.md$/, ""),
        date: data.date || null,
        tags: Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : [],
        draft: data.draft === true,
        maturity: data.maturity || "seedling",
        aliases: Array.isArray(data.aliases)
          ? data.aliases
          : data.aliases
            ? [data.aliases]
            : [],
        links,
        content, // raw body for rendering
      };
    })
    .filter((n) => !n.draft);

  // Build idMap for markdown-it wikilink plugin
  const idMap = {};
  notas.forEach((n) => {
    idMap[n.id] = { title: n.title, slug: n.id };
    idMap[n.fileSlug] = { title: n.title, slug: n.id };
    n.aliases.forEach((a) => {
      if (!idMap[a]) idMap[a] = { title: n.title, slug: n.id };
    });
  });
  globalThis.__zettelIdMap = idMap;

  // Compute backlinks
  const backlinksMap = {};
  notas.forEach((n) => {
    backlinksMap[n.id] = [];
  });
  notas.forEach((source) => {
    source.links.forEach((targetId) => {
      // Resolve target via idMap
      const resolved = idMap[targetId];
      if (resolved) {
        const targetKey = resolved.slug;
        if (backlinksMap[targetKey] && !backlinksMap[targetKey].find((bl) => bl.id === source.id)) {
          backlinksMap[targetKey].push({
            id: source.id,
            title: source.title,
            date: source.date,
            maturity: source.maturity,
          });
        }
      }
    });
  });

  return { notas, backlinksMap, idMap };
};
