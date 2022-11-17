var mapSvg, tooltip, mapttstring;

var mapData;
var popData;
var colorchoice = "orange";
var drawborder = true;
var margin = { left: 80, right: 80, top: 50, bottom: 50 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;
// This runs when the page is loaded
document.addEventListener("DOMContentLoaded", function () {
  mapSvg = d3.select("#dataviz");
  tooltip = d3.select(".tooltip");
  // set the dimensions of the svg
  mapSvg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  // make mapsvg 10x bigger

  // Load both files before doing anything else
  Promise.all([d3.json("us.geojson"), d3.csv("population.csv")]).then(function (
    values
  ) {
    mapData = values[0];
    popData = values[1];
    // filter map data to only include state with STATE 24
    mapData.features = mapData.features.filter(function (d) {
      return d.properties.STATE == 24;
    });

    // filter pop data to only include state with STATE 24
    popData = popData.filter(function (d) {
      return d["GEO.display-label"] == "Maryland";
    });
    drawMap();
  });
});

// Draw the map in the #map svg
function drawMap() {
  mapSvg.selectAll("*").remove();
  // create the map projection and geoPath
  let projection = d3
    .geoMercator()
    .scale(400)
    .center(d3.geoCentroid(mapData))
    .translate([
      +mapSvg.style("width").replace("px", "") / 2,
      +mapSvg.style("height").replace("px", "") / 2.3,
    ])
    // make projection bigger
    .scale(10000);
  let path = d3.geoPath().projection(projection);
  let extent = d3.extent(
    popData,
    (d) => +d["Density per square mile of land area"]
  );

  if (colorchoice == "orange") {
    var colorScale = d3.scaleSequential(d3.interpolateOrRd).domain(extent);
  } else {
    var colorScale = d3.scaleSequential(d3.interpolateBlues).domain(extent);
  }

  // draw the map on the #map svg
  let g = mapSvg.append("g");
  g.selectAll("path")
    .data(mapData.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("id", (d) => {
      return d.properties.name;
    })
    .attr("class", "countrymap")
    .style("fill", (d) => {
      let val = popData.filter((p) => {
        return p["GCT_STUB.target-geo-id"] == d.properties.GEO_ID;
      })[0];
      if (isNaN(val)) return "grey";
      return colorScale(+val["Density per square mile of land area"]);
      return colorScale(val);
    })
    .style("stroke", drawborder ? "black" : "none")
    .on("mouseover", function (d, i) {
      let val = popData.filter((p) => {
        return p["GCT_STUB.target-geo-id"] == d.properties.GEO_ID;
      })[0]["Density per square mile of land area"];
      if (drawborder)
        d3.select(this).style("stroke", "cyan").style("stroke-width", 4);
      tooltip.transition().duration(50).style("opacity", 1);
      mapttstring = `County: ${d.properties.NAME} <br/> Population Density per square mile of land area: ${val}`;
    })
    .on("mousemove", function (d, i) {
      tooltip
        .html(mapttstring)
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 15 + "px");
    })
    .on("mouseout", function (d, i) {
      d3.select(this)
        .style("stroke", drawborder ? "black" : "none")
        .style("stroke-width", 1);
      //Makes the new div disappear:
      tooltip.transition().duration("50").style("opacity", 0);
    });
  // .on("click", function (d, i) {
  //   drawLineChart(d.properties.name);
  // })

  // draw the legend for the map
  barWidth = 200;
  barHeight = 20;
  axisScale = d3.scaleLinear().domain(colorScale.domain()).range([10, 210]);

  axisBottom = (g) =>
    g
      .attr("class", `x-axis`)
      .attr("transform", `translate(0,400)`)
      .call(d3.axisBottom(axisScale).ticks(4).tickSize(-barHeight));

  const defs = mapSvg.append("defs");

  const linearGradient = defs
    .append("linearGradient")
    .attr("id", "linear-gradient");

  linearGradient
    .selectAll("stop")
    .data(
      colorScale.ticks().map((t, i, n) => ({
        offset: `${(100 * i) / n.length}%`,
        color: colorScale(t),
      }))
    )
    .enter()
    .append("stop")
    .attr("offset", (d) => d.offset)
    .attr("stop-color", (d) => d.color);

  mapSvg
    .append("g")
    .attr("transform", `translate(0,380)`)
    .append("rect")
    .attr("transform", `translate(10, 0)`)
    .attr("width", 200)
    .attr("height", barHeight)
    .style("fill", "url(#linear-gradient)");
  mapSvg.append("g").call(axisBottom);
}

function togglecolor() {
  if (colorchoice == "orange") {
    colorchoice = "blue";
  } else {
    colorchoice = "orange";
  }
  drawMap();
}

function toggleborder() {
  drawborder = !drawborder;
  drawMap();
}
