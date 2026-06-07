// Full graph page — force-directed layout of all notes
(function () {
  const dataEl = document.getElementById("grafo-data");
  if (!dataEl) return;

  const { nodes, links } = JSON.parse(dataEl.textContent);
  if (!nodes.length) return;

  const svg = d3.select("#grafo-svg");
  const tooltip = d3.select("#grafo-tooltip");

  const container = svg.node().parentNode;
  const width = container.clientWidth;
  const height = Math.max(500, window.innerHeight * 0.7);

  svg.attr("viewBox", [0, 0, width, height]);

  const g = svg.append("g");

  // Color scale by group
  const colors = [
    "#5b8cb8", "#8a7a5a", "#6a8a7a", "#b08a6a",
    "#7a6a8a", "#6a8a8a", "#b86a6a", "#8a8a6a",
    "#5a7a8a", "#8a6a8a",
  ];

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(80),
    )
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((d) => d.radius + 4));

  const link = g
    .append("g")
    .attr("stroke", "var(--border, #3a3a32)")
    .attr("stroke-opacity", 0.5)
    .attr("stroke-width", 1)
    .selectAll("line")
    .data(links)
    .join("line");

  const node = g
    .append("g")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => colors[d.group % colors.length])
    .attr("stroke", "var(--bg, #1a1a18)")
    .attr("stroke-width", 1.5)
    .attr("cursor", "pointer")
    .on("mouseover", function (event, d) {
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${d.title}</strong><br>
           <small>${d.maturity || ""} · ${d.tags ? d.tags.slice(0, 3).join(", ") : ""}</small>`,
        );
      d3.select(this)
        .transition()
        .duration(150)
        .attr("r", d.radius * 1.4);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.offsetX + 15 + "px")
        .style("top", event.offsetY - 10 + "px");
    })
    .on("mouseout", function (_event, d) {
      tooltip.style("opacity", 0);
      d3.select(this)
        .transition()
        .duration(150)
        .attr("r", d.radius);
    })
    .on("click", (_event, d) => {
      window.location.href = (window.ZETTEL_BASE || "") + "/notas/" + d.id + "/";
    })
    .call(
      d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );

  // Labels: only show for larger nodes
  const label = g
    .append("g")
    .selectAll("text")
    .data(nodes.filter((d) => d.radius >= 6))
    .join("text")
    .text((d) => d.title.length > 20 ? d.title.slice(0, 18) + "…" : d.title)
    .attr("font-size", 9)
    .attr("dx", (d) => d.radius + 4)
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
