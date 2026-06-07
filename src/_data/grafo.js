module.exports = function () {
  const notasData = require("./notas")();
  const { notas, idMap } = notasData;

  const nodeSet = new Map();
  const nodes = [];
  const linkSet = new Set();

  notas.forEach((n) => {
    if (n.draft) return;
    const degree = n.links.length;
    nodeSet.set(n.id, {
      id: n.id,
      title: n.title,
      tags: n.tags,
      maturity: n.maturity,
      date: n.date,
      degree,
      degreeIn: 0,
    });
  });

  // Count incoming links
  notas.forEach((source) => {
    if (source.draft) return;
    source.links.forEach((targetRaw) => {
      const resolved = idMap[targetRaw];
      if (!resolved) return;
      const targetId = resolved.slug;
      if (!nodeSet.has(targetId)) return;
      nodeSet.get(targetId).degreeIn++;

      const linkKey = `${source.id}→${targetId}`;
      if (!linkSet.has(linkKey)) {
        linkSet.add(linkKey);
      }
    });
  });

  nodeSet.forEach((node, _id) => {
    nodes.push(node);
  });

  const links = [];
  linkSet.forEach((key) => {
    const [source, target] = key.split("→");
    links.push({ source, target });
  });

  // Tag-based groups for coloring
  const tagGroupMap = {};
  let groupIdx = 0;
  nodes.forEach((n) => {
    const primaryTag = n.tags[0] || "sem-tag";
    if (!(primaryTag in tagGroupMap)) {
      tagGroupMap[primaryTag] = groupIdx++;
    }
  });
  nodes.forEach((n) => {
    const primaryTag = n.tags[0] || "sem-tag";
    n.group = tagGroupMap[primaryTag];
    n.radius = Math.max(4, Math.min(20, 5 + (n.degree + n.degreeIn) * 1.5));
  });

  return { nodes, links, tagGroups: Object.keys(tagGroupMap) };
};
