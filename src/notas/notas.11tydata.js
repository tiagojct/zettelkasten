module.exports = {
  layout: "nota",
  eleventyComputed: {
    maturity(data) {
      return data.maturity || "seedling";
    },
    permalink(data) {
      if (data.draft) return false;
      return `/notas/${data.id}/`;
    },
    backlinks(data) {
      const map = data.notas?.backlinksMap || {};
      return map[data.id] || [];
    },
    allNotas(data) {
      return data.notas?.notas || [];
    },
    linkedNotes(data) {
      const notasArr = data.notas?.notas || [];
      const id = data.id;
      // Find the current note in the notas array
      const current = notasArr.find((n) => n.id === id);
      if (!current) return [];
      return current.links
        .map((linkId) => {
          const resolved = data.notas?.idMap?.[linkId];
          if (!resolved) return null;
          return notasArr.find((n) => n.id === resolved.slug) || null;
        })
        .filter(Boolean);
    },
  },
};
