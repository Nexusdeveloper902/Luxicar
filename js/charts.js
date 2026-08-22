// ============================================================================
// charts.js — Gráficos SVG (área, barras verticales/horizontales, donut).
// Sustituyen a recharts en el panel administrativo, con la misma paleta,
// cuadrícula discontinua y tooltips de la aplicación original.
// ============================================================================
"use strict";

const Charts = (function () {
  const CHART_COLORS = [
    "var(--signature)", "var(--success)", "#60a5fa", "#f472b6", "#a78bfa",
    "#fb923c", "#34d399", "#f87171", "#facc15", "#22d3ee",
  ];

  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs) {
    const n = document.createElementNS(SVG_NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function niceTicks(max, count) {
    if (max <= 0) return [0];
    const rough = max / (count - 1);
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    let step = mag;
    for (const m of [1, 2, 2.5, 5, 10]) {
      if (rough <= m * mag) { step = m * mag; break; }
    }
    const top = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v);
    return ticks;
  }

  function montarTooltip(wrap) {
    const tip = document.createElement("div");
    tip.className = "chart-tooltip";
    wrap.appendChild(tip);
    return tip;
  }

  function textoAxis(x, y, contenido, anchor) {
    const t = el("text", {
      x, y, "text-anchor": anchor || "middle", class: "chart-axis-text",
    });
    t.textContent = contenido;
    return t;
  }

  // --- Gráfico de área (monotone) -----------------------------------------
  function area(wrap, opc) {
    const data = opc.data; // [{label, value}]
    const H = opc.height || 320;
    const W = 1000;
    const margin = { top: 12, right: 12, bottom: 26, left: 52 };
    const iw = W - margin.left - margin.right;
    const ih = H - margin.top - margin.bottom;
    const maxV = Math.max.apply(null, data.map((d) => d.value).concat([1]));
    const ticks = niceTicks(maxV, 5);
    const topV = ticks[ticks.length - 1];

    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", width: "100%", height: H });
    svg.style.height = H + "px";

    const gid = "g" + Math.random().toString(36).slice(2, 8);
    const defs = el("defs");
    const grad = el("linearGradient", { id: gid, x1: "0", y1: "0", x2: "0", y2: "1" });
    const s1 = el("stop", { offset: "0%", "stop-color": opc.color, "stop-opacity": "0.4" });
    const s2 = el("stop", { offset: "100%", "stop-color": opc.color, "stop-opacity": "0" });
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    const X = (i) => margin.left + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const Y = (v) => margin.top + ih - (v / topV) * ih;

    ticks.forEach((tv) => {
      svg.appendChild(el("line", {
        x1: margin.left, x2: W - margin.right, y1: Y(tv), y2: Y(tv), class: "chart-grid-line",
      }));
      svg.appendChild(textoAxis(margin.left - 10, Y(tv) + 4, opc.yFormat(tv), "end"));
    });
    data.forEach((d, i) => {
      if (i % (opc.labelInterval || 3) !== 0) return;
      svg.appendChild(textoAxis(X(i), H - 8, d.label));
    });

    // Curva suavizada (catmull-rom -> bézier)
    const pts = data.map((d, i) => [X(i), Y(d.value)]);
    let dPath = "M" + pts[0][0] + "," + pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      dPath += "C" + c1x.toFixed(2) + "," + c1y.toFixed(2) + " " + c2x.toFixed(2) + "," + c2y.toFixed(2) + " " + p2[0].toFixed(2) + "," + p2[1].toFixed(2);
    }
    const baseY = margin.top + ih;
    const areaPath = dPath + "L" + pts[pts.length - 1][0] + "," + baseY + "L" + pts[0][0] + "," + baseY + "Z";
    const areaEl = el("path", { d: areaPath, fill: "url(#" + gid + ")", class: "chart-area-anim" });
    const lineEl = el("path", { d: dPath, fill: "none", stroke: opc.color, "stroke-width": 2, class: "chart-area-anim" });
    svg.appendChild(areaEl);
    svg.appendChild(lineEl);

    const puntos = [];
    data.forEach((d, i) => {
      const c = el("circle", { cx: X(i), cy: Y(d.value), r: 4, fill: opc.color, stroke: "var(--card)", "stroke-width": 2, opacity: 0 });
      svg.appendChild(c);
      puntos.push(c);
    });

    const tip = montarTooltip(wrap);
    svg.addEventListener("mousemove", (ev) => {
      const rect = svg.getBoundingClientRect();
      const relX = ((ev.clientX - rect.left) / rect.width) * W;
      let idx = 0, best = Infinity;
      for (let i = 0; i < data.length; i++) {
        const dd = Math.abs(X(i) - relX);
        if (dd < best) { best = dd; idx = i; }
      }
      puntos.forEach((c, i) => c.setAttribute("opacity", i === idx ? 1 : 0));
      tip.innerHTML = "<strong>" + esc(opc.tooltipFormat(data[idx].value)) + "</strong><br><span style='color:var(--muted-foreground)'>" + esc(data[idx].label) + "</span>";
      tip.style.left = ((X(idx) / W) * 100) + "%";
      tip.style.top = ((Y(data[idx].value) / H) * 100) + "%";
      tip.classList.add("visible");
    });
    svg.addEventListener("mouseleave", () => {
      tip.classList.remove("visible");
      puntos.forEach((c) => c.setAttribute("opacity", 0));
    });

    wrap.appendChild(svg);
  }

  // --- Barras verticales -----------------------------------------------------
  function barras(wrap, opc) {
    const data = opc.data; // [{label, value}]
    const H = opc.height || 260;
    const W = 1000;
    const margin = { top: 12, right: 12, bottom: 26, left: 52 };
    const iw = W - margin.left - margin.right;
    const ih = H - margin.top - margin.bottom;
    const maxV = Math.max.apply(null, data.map((d) => d.value).concat([1]));
    const ticks = niceTicks(maxV, 5);
    const topV = ticks[ticks.length - 1];
    const radio = opc.radius == null ? 8 : opc.radius;

    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", width: "100%", height: H });
    svg.style.height = H + "px";

    const slot = iw / data.length;
    const bw = Math.min(slot * 0.55, 120);
    const Y = (v) => margin.top + ih - (v / topV) * ih;

    ticks.forEach((tv) => {
      svg.appendChild(el("line", { x1: margin.left, x2: W - margin.right, y1: Y(tv), y2: Y(tv), class: "chart-grid-line" }));
      svg.appendChild(textoAxis(margin.left - 10, Y(tv) + 4, opc.yFormat(tv), "end"));
    });

    const tip = montarTooltip(wrap);
    data.forEach((d, i) => {
      const x = margin.left + slot * i + (slot - bw) / 2;
      const h = Math.max(0, ih - (Y(d.value) - margin.top));
      const r = el("rect", {
        x, y: Y(d.value), width: bw, height: h,
        rx: Math.min(radio, bw / 2), fill: opc.color, class: "chart-bar-anim",
        style: "animation-delay:" + (i * 0.05) + "s",
      });
      svg.appendChild(r);
      svg.appendChild(textoAxis(margin.left + slot * i + slot / 2, H - 8, d.label));
      const hit = el("rect", { x: margin.left + slot * i, y: margin.top, width: slot, height: ih, fill: "transparent" });
      hit.addEventListener("mouseenter", () => {
        r.setAttribute("opacity", "0.8");
        tip.innerHTML = "<strong>" + esc(opc.tooltipFormat(d.value)) + "</strong><br><span style='color:var(--muted-foreground)'>" + esc(d.label) + "</span>";
        tip.style.left = (((margin.left + slot * i + slot / 2) / W) * 100) + "%";
        tip.style.top = ((Y(d.value) / H) * 100) + "%";
        tip.classList.add("visible");
      });
      hit.addEventListener("mouseleave", () => {
        r.setAttribute("opacity", "1");
        tip.classList.remove("visible");
      });
      svg.appendChild(hit);
    });

    wrap.appendChild(svg);
  }

  // --- Barras horizontales ---------------------------------------------------
  function barrasH(wrap, opc) {
    const data = opc.data;
    const H = opc.height || 260;
    const W = 1000;
    const margin = { top: 8, right: 40, bottom: 26, left: 110 };
    const iw = W - margin.left - margin.right;
    const ih = H - margin.top - margin.bottom;
    const maxV = Math.max.apply(null, data.map((d) => d.value).concat([1]));
    const ticks = niceTicks(maxV, 5);
    const topV = ticks[ticks.length - 1];

    const svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", width: "100%", height: H });
    svg.style.height = H + "px";

    const slot = ih / data.length;
    const bh = Math.min(slot * 0.6, 34);
    const X = (v) => margin.left + (v / topV) * iw;

    ticks.forEach((tv) => {
      svg.appendChild(el("line", { x1: X(tv), x2: X(tv), y1: margin.top, y2: margin.top + ih, class: "chart-grid-line" }));
      svg.appendChild(textoAxis(X(tv), H - 8, String(tv)));
    });

    const tip = montarTooltip(wrap);
    data.forEach((d, i) => {
      const y = margin.top + slot * i + (slot - bh) / 2;
      const w = Math.max(0, X(d.value) - margin.left);
      const r = el("rect", {
        x: margin.left, y, width: w, height: bh, rx: Math.min(8, bh / 2),
        fill: CHART_COLORS[i % CHART_COLORS.length], class: "chart-bar-h-anim",
        style: "animation-delay:" + (i * 0.05) + "s",
      });
      svg.appendChild(r);
      const lbl = textoAxis(margin.left - 10, y + bh / 2 + 4, d.label, "end");
      svg.appendChild(lbl);
      const hit = el("rect", { x: margin.left, y: margin.top + slot * i, width: iw, height: slot, fill: "transparent" });
      hit.addEventListener("mouseenter", () => {
        tip.innerHTML = "<strong>" + esc(opc.tooltipFormat(d.value)) + "</strong><br><span style='color:var(--muted-foreground)'>" + esc(d.label) + "</span>";
        tip.style.left = (((margin.left + w) / W) * 100) + "%";
        tip.style.top = (((y + bh / 2) / H) * 100) + "%";
        tip.classList.add("visible");
      });
      hit.addEventListener("mouseleave", () => tip.classList.remove("visible"));
      svg.appendChild(hit);
    });

    wrap.appendChild(svg);
  }

  // --- Donut -----------------------------------------------------------------
  function donut(wrap, opc) {
    const data = opc.data.filter((d) => d.value > 0);
    const H = opc.height || 260;
    const size = 260;
    const cx = size / 2, cy = size / 2;
    const rOut = 90, rIn = 50, pad = 0.02; // radianes aprox. para paddingAngle 2
    const total = data.reduce((s, d) => s + d.value, 0) || 1;

    const svg = el("svg", { viewBox: "0 0 " + size + " " + size, width: "100%", height: H });
    svg.style.height = H + "px";

    function punto(ang, r) {
      return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
    }

    let ang = -Math.PI / 2;
    const tip = montarTooltip(wrap);
    data.forEach((d, i) => {
      const span = (d.value / total) * Math.PI * 2;
      const a0 = ang + pad / 2;
      const a1 = ang + span - pad / 2;
      ang += span;
      if (a1 <= a0) return;
      const [x0, y0] = punto(a0, rOut);
      const [x1, y1] = punto(a1, rOut);
      const [x2, y2] = punto(a1, rIn);
      const [x3, y3] = punto(a0, rIn);
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const dPath =
        "M" + x0.toFixed(2) + "," + y0.toFixed(2) +
        " A" + rOut + "," + rOut + " 0 " + large + " 1 " + x1.toFixed(2) + "," + y1.toFixed(2) +
        " L" + x2.toFixed(2) + "," + y2.toFixed(2) +
        " A" + rIn + "," + rIn + " 0 " + large + " 0 " + x3.toFixed(2) + "," + y3.toFixed(2) + " Z";
      const p = el("path", {
        d: dPath, fill: CHART_COLORS[i % CHART_COLORS.length],
        class: "chart-area-anim", style: "animation-delay:" + (i * 0.05) + "s",
      });
      p.addEventListener("mouseenter", (ev) => {
        p.setAttribute("opacity", "0.8");
        tip.innerHTML = "<strong>" + esc(opc.tooltipFormat(d.value)) + "</strong><br><span style='color:var(--muted-foreground)'>" + esc(d.label) + "</span>";
        const rect = svg.getBoundingClientRect();
        tip.style.left = (((ev.clientX - rect.left) / rect.width) * 100) + "%";
        tip.style.top = (((ev.clientY - rect.top) / rect.height) * 100) + "%";
        tip.classList.add("visible");
      });
      p.addEventListener("mouseleave", () => {
        p.setAttribute("opacity", "1");
        tip.classList.remove("visible");
      });
      svg.appendChild(p);
    });

    const cont = document.createElement("div");
    cont.className = "flex items-center justify-center";
    cont.appendChild(svg);
    wrap.appendChild(cont);
  }

  return { CHART_COLORS, area, barras, barrasH, donut };
})();
