// Global id-to-title map populated by _data/notas.js before templates render
globalThis.__zettelIdMap = {};
globalThis.__zettelPrefix = "";

function wikilinkPlugin(md, lookupFn, getPrefix) {
  const defaultRender =
    md.renderer.rules.link_open ||
    function (tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.core.ruler.before("normalize", "wikilink", (state) => {
    const prefix = getPrefix ? getPrefix() : "";
    state.src = state.src.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_, target, display) => {
        const map = lookupFn();
        const id = target.trim();
        const entry = map[id] ? map[id] : map[String(id)];
        const title = display
          ? display.trim()
          : entry
            ? entry.title
            : id;
        const slug = entry ? (entry.slug || id) : id;
        return `[${title}](${prefix}/notas/${slug}/)`;
      },
    );
  });
}

module.exports = function (eleventyConfig) {
  // Set prefix for markdown-it wikilink plugin
  globalThis.__zettelPrefix = "/zettelkasten";

  // --- Markdown with wikilinks ---
  const markdownIt = require("markdown-it");
  const md = markdownIt({ html: true, breaks: false, linkify: true });
  md.use(wikilinkPlugin, () => globalThis.__zettelIdMap, () => globalThis.__zettelPrefix);
  eleventyConfig.setLibrary("md", md);

  // --- Passthrough copies ---
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");

  // --- Collections ---
  eleventyConfig.addCollection("notas", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/notas/*.md")
      .filter((n) => !n.data.draft)
      .sort((a, b) => b.data.id.localeCompare(a.data.id));
  });

  eleventyConfig.addCollection("tagsList", (collectionApi) => {
    const tagMap = {};
    collectionApi.getFilteredByGlob("src/notas/*.md").forEach((note) => {
      if (note.data.draft) return;
      (note.data.tags || []).forEach((tag) => {
        if (!tagMap[tag]) {
          tagMap[tag] = { tag, count: 0 };
        }
        tagMap[tag].count++;
      });
    });
    return Object.values(tagMap).sort((a, b) => a.tag.localeCompare(b.tag));
  });

  eleventyConfig.addCollection("notasByTag", (collectionApi) => {
    const byTag = {};
    collectionApi.getFilteredByGlob("src/notas/*.md").forEach((note) => {
      if (note.data.draft) return;
      (note.data.tags || []).forEach((tag) => {
        if (!byTag[tag]) byTag[tag] = [];
        byTag[tag].push(note);
      });
    });
    return byTag;
  });

  // --- Filters ---
  eleventyConfig.addFilter("formatDate", (dateStr) => {
    const d = new Date(dateStr);
    const meses = [
      "jan", "fev", "mar", "abr", "mai", "jun",
      "jul", "ago", "set", "out", "nov", "dez",
    ];
    return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
  });

  eleventyConfig.addFilter("limit", (arr, n) => arr.slice(0, n));

  eleventyConfig.addFilter("without", (arr, excludeId) =>
    arr.filter((n) => n.data.id !== excludeId),
  );

  eleventyConfig.addFilter("randomId", (arr) => {
    if (!arr || !arr.length) return "";
    const idx = Math.floor(Math.random() * arr.length);
    return arr[idx].data.id;
  });

  eleventyConfig.addFilter("isoDate", (d) => {
    if (!d) return "";
    const dt = d instanceof Date ? d : new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: "/zettelkasten/",
  };
};
