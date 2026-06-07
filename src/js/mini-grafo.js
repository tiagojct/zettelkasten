// Mini neighborhood graph — shows current note + its connections
(function () {
  const container = document.getElementById("mini-grafo-container");
  const dataEl = document.getElementById("mini-grafo-data");
  if (!container || !dataEl) return;

  const data = JSON.parse(dataEl.textContent);
  const { center, linked, backlinks } = data;

  // Build nodes: center + all unique linked/backlinked
  const nodeMap = new Map();
  nodeMap.set(center.id, { ...center, type: "center" });
  linked.forEach((n) => {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, { ...n, type: "linked" });
  });
  backlinks.forEach((n) => {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, { ...n, type: "backlink" });
  });

  const nodes = Array.from(nodeMap.values());
  if (nodes.length < 2) {
    // Only the center, no connections — show a message
    container.innerHTML =
      '<p style="text-align:center;color:var(--text-muted);padding-top:90px;font-size:0.85rem">Nota isolada — sem ligações ainda.</p>';
    return;
  }

  // Build links: center → linked, backlinks → center
  const linkSet = new Set();
  const links = [];
  linked.forEach((n) => {
    const key = `${center.id}→${n.id}`;
    if (!linkSet.has(key)) {
      linkSet.add(key);
      links.push({ source: center.id, target: n.id });
    }
  });
  backlinks.forEach((n) => {
    const key = `${n.id}→${center.id}`;
    if (!linkSet.has(key)) {
      linkSet.add(key);
      links.push({ source: n.id, target: center.id });
    }
  });

  const width = container.clientWidth;
  const height = 220;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  const colors = {
    center: "#5b8cb8",
    linked: "#8a7a5a",
    backlink: "#6a8a7a",
  };

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(50),
    )
    .force("charge", d3.forceManyBody().strength(-120))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide(18));

  const link = svg
    .append("g")
    .attr("stroke", "var(--border, #3a3a32)")
    .attr("stroke-opacity", 0.45)
    .attr("stroke-width", 1)
    .selectAll("line")
    .data(links)
    .join("line");

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", (d) => (d.type === "center" ? 10 : 6))
    .attr("fill", (d) => colors[d.type])
    .attr("stroke", "var(--bg, #1a1a18)")
    .attr("stroke-width", 1.5)
    .attr("cursor", "pointer")
    .on("mouseover", function (_event, d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("r", (d.type === "center" ? 13 : 9));
    })
    .on("mouseout", function (_event, d) {
      d3.select(this)
        .transition()
        .duration(100)
        .attr("r", (d.type === "center" ? 10 : 6));
    })
    .on("click", (_event, d) => {
      if (d.id !== center.id) {
        window.location.href = (window.ZETTEL_BASE || "") + "/notas/" + d.id + "/";
      }
    });

  // Labels
  const label = svg
    .append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text((d) => (d.title.length > 14 ? d.title.slice(0, 12) + "…" : d.title))
    .attr("font-size", (d) => (d.type === "center" ? 9 : 7.5))
    .attr("font-weight", (d) => (d.type === "center" ? "600" : "400"))
    .attr("dx", 12)
    .attr("dy", 3)
    .attr("fill", "var(--text-muted, #9a968e)")
    .attr("pointer-events", "none");

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

    label.attr("x", (d) => d.x).attr("y", (d) => d.y);
  });
})();
