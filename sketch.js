// ============================================================
//  My Coding Journal — 1:2 俐落直覺版 (Iframe 直接載入)
//  左側：時光記憶圖譜 (1/3) | 右側：作品動態展示區 (2/3)
// ============================================================

// ── 1. 作品資料（只需改這裡）─────────────────────────────
const WEEKS = [
 {
    week: 1, title: "水草", subtitle: "Seaweed Animation",
    link: "https://jovie6818-byte.github.io/6511-0324/",
    bookColor: [0, 200, 255], vineColor: [120, 220, 80], icon: "🌿",
  },
  {
    week: 2, title: "互動藝術程式創作", subtitle: "Vertex Shape Design",
    link: "https://jovie6818-byte.github.io/6511-0317/",
    bookColor: [167, 139, 250], vineColor: [80, 200, 120], icon: "🖱️",
  },
  {
    week: 3, title: "找地雷", subtitle: "Mouse Interaction",
    link: "https://jovie6818-byte.github.io/6511-0444/",
    bookColor: [52, 211, 153], vineColor: [60, 180, 160], icon: "💣",
  },
  {
    week: 4, title: "電流急急棒", subtitle: "Particle System",
    link: "https://jovie6818-byte.github.io/6511-0407/",
    bookColor: [251, 146, 60], vineColor: [100, 210, 60], icon: "⚡",
  },
  {
    week: 5, title: "即時影像擷取", subtitle: "Webcam Pixels",
    link: "https://jovie6818-byte.github.io/6511-0421/",
    bookColor: [244, 114, 182], vineColor: [160, 230, 40], icon: "📷",
  },
];

// ── 2. 系統頁面 ───────────────────────────────────────────
const BOOK_PAGES = [
  { type: "cover" },
  ...WEEKS.map((w) => ({ type: "week", ...w })),
  { type: "summary" },
];

// ── 3. 全域狀態 ───────────────────────────────────────────
let currentPage = 0; // 0 是封面
let timer = 0;
let vineParticles = [], roots = [], vineNodes = [];
let hoverNode = -1;

// UI 元素
let iframeEl, viewerPanel, viewerTitle;
let navEl, prevBtn, nextBtn, tooltipEl;

// ════════════════════════════════════════════════════════════
//  CLASS 定義 (左側圖譜與粒子)
// ════════════════════════════════════════════════════════════

class VineParticle {
  constructor() { this.reset(); }
  reset() {
    this.x = random(0, width / 3);
    this.y = random(height);
    this.vy = random(-0.2, -0.6); this.vx = random(-0.15, 0.15);
    this.r = random(0.5, 1.8); this.alpha = random(15, 65); this.hue = random(80, 150); this.life = 1;
  }
  update() { this.x += this.vx; this.y += this.vy; this.life -= 0.003; if (this.life < 0) this.reset(); }
  draw() {
    noStroke(); colorMode(HSB, 360, 100, 100, 255);
    fill(this.hue, 65, 80, this.alpha * this.life); circle(this.x, this.y, this.r * 2);
    colorMode(RGB, 255);
  }
}

class Root {
  constructor(x, y, angle, depth) {
    this.x = x; this.y = y; this.angle = angle; this.depth = depth;
    this.len = random(16, 34); this.grown = 0; this.speed = random(0.4, 0.8);
    this.spawned = false; this.alpha = random(55, 120);
  }
  update() {
    if (this.grown < 1) this.grown = min(1, this.grown + this.speed * 0.014);
    if (this.grown > 0.65 && !this.spawned && this.depth < 5) {
      this.spawned = true;
      if (random() < 0.55) {
        let da = random(0.3, 0.85) * (random() < 0.5 ? 1 : -1);
        roots.push(new Root(
          this.x + cos(this.angle) * this.len * this.grown,
          this.y + sin(this.angle) * this.len * this.grown,
          this.angle + da, this.depth + 1
        ));
      }
    }
  }
  draw() {
    let ex = this.x + cos(this.angle) * this.len * this.grown;
    let ey = this.y + sin(this.angle) * this.len * this.grown;
    let a = this.alpha * (1 - this.depth * 0.16);
    stroke(70 + this.depth * 10, 150 + this.depth * 8, 35, a);
    strokeWeight(max(0.4, 2.2 - this.depth * 0.42));
    line(this.x, this.y, ex, ey);
  }
}

class SeedNode {
  constructor(x, y, data, idx) {
    this.x = x; this.y = y; this.data = data; this.idx = idx;
    this.r = 24; this.pulseT = random(TWO_PI);
    this.bloomT = 0; this.blooming = false;
    this.petals = floor(random(5, 8)); this.leafAngle = random(TWO_PI);
  }
  startBloom() { this.blooming = true; this.bloomT = 0; }
  update() {
    this.pulseT += 0.035;
    if (this.blooming) { this.bloomT += 0.055; if (this.bloomT > 1) this.blooming = false; }
  }
  isHov() { return dist(mouseX, mouseY, this.x, this.y) < this.r + 12; }
  draw() {
    let [r, g, b] = this.data.vineColor;
    let hov = this.isHov();
    let isActivePage = (currentPage === this.idx + 1); 
    let cr = this.r + (hov || isActivePage ? 9 : 0) + sin(this.pulseT) * 4 * (hov || isActivePage ? 0.4 : 0.15);
    
    if (this.blooming || hov || isActivePage) {
      let prog = this.blooming ? min(this.bloomT, 1) : 1;
      for (let i = 0; i < this.petals; i++) {
        let a = (i / this.petals) * TWO_PI + timer * 0.4 + this.leafAngle;
        let pr = cr * (1.5 + prog * 0.9);
        fill(r, g, b, (hov || isActivePage) ? 150 : prog * 165); noStroke();
        ellipse(this.x + cos(a) * pr, this.y + sin(a) * pr, cr * 0.65 * prog, cr * 0.38 * prog);
      }
    }
    fill(r, g, b, 28); noStroke(); circle(this.x, this.y, cr * 2.7);
    fill(r, g, b, 75); circle(this.x, this.y, cr * 2);
    fill(r, g, b, (hov || isActivePage) ? 215 : 150); stroke(r, g, b, (hov || isActivePage) ? 250 : 190); strokeWeight(1.4);
    circle(this.x, this.y, cr * 1.95);
    noStroke(); fill(255, 255, 255, (hov || isActivePage) ? 255 : 160);
    textAlign(CENTER, CENTER); textSize(cr * 0.8); text(this.data.icon, this.x, this.y);
    fill(r, g, b, (hov || isActivePage) ? 255 : 170); textSize(10); textAlign(CENTER, TOP);
    text("W" + this.data.week, this.x, this.y + cr + 4);
    fill(255, 255, 255, (hov || isActivePage) ? 220 : 110); textSize(9);
    text(this.data.title, this.x, this.y + cr + 16);
  }
}

// ════════════════════════════════════════════════════════════
//  右側靜態頁面繪製 (封面與總結)
// ════════════════════════════════════════════════════════════

function drawRR(x, y, w, h, r) {
  beginShape();
  vertex(x + r, y); vertex(x + w - r, y); quadraticVertex(x + w, y, x + w, y + r);
  vertex(x + w, y + h - r); quadraticVertex(x + w, y + h, x + w - r, y + h);
  vertex(x + r, y + h); quadraticVertex(x, y + h, x, y + h - r);
  vertex(x, y + r); quadraticVertex(x, y, x + r, y);
  endShape(CLOSE);
}

function getRightBounds() {
  let rightWidth = width * (2 / 3);
  let bw = min(rightWidth * 0.75, 500); 
  let bh = min(height * 0.6, 400);
  let bx = width / 3 + (rightWidth - bw) / 2; 
  let by = (height - bh) / 2 - 20; // 稍微往上提一點
  return { bx, by, bw, bh };
}

function drawCover() {
  let { bx, by, bw, bh } = getRightBounds();
  let cx = bx + bw / 2, cy = by + bh / 2;
  
  noFill();
  for (let i = 1; i <= 4; i++) { 
    stroke(0, 180, 200, 12 - i * 2); strokeWeight(1); 
    drawRR(bx + 20 + i * 8, by + 20 + i * 8, bw - 40 - i * 16, bh - 40 - i * 16, 8); 
  }
  
  let dc = [[0, 200, 255], [120, 220, 80], [52, 211, 153], [251, 146, 60], [244, 114, 182], [96, 165, 250]];
  for (let i = 0; i < 6; i++) {
    let a = (i / 6) * TWO_PI + timer * 0.28;
    noStroke(); fill(dc[i][0], dc[i][1], dc[i][2], 135 + sin(timer + i) * 52);
    circle(cx + cos(a) * 88, cy + sin(a) * 52, 7);
  }
  
  noStroke(); textAlign(CENTER, CENTER); textFont("monospace");
  textSize(bw * 0.08); fill(255); text("My Coding", cx, cy - 26); text("Journal", cx, cy + 16);
  textSize(bw * 0.03); fill(0, 200, 180, 125); text("學期作品集  2024", cx, cy + 60);
  textSize(bw * 0.022); fill(255, 255, 255, 65 + sin(timer * 1.8) * 35);
  text("▶  點選左側節點，或下方按鈕開始瀏覽", cx, by + bh + 10);
}

function drawSummary() {
  let { bx, by, bw, bh } = getRightBounds();
  let cx = bx + bw / 2; textFont("monospace");
  
  noStroke(); textAlign(LEFT, TOP); textSize(bw * 0.03); fill(0, 200, 180, 90);
  text("SEMESTER SUMMARY", bx + 10, by);
  stroke(0, 200, 180, 25); strokeWeight(1); line(bx + 10, by + 20, bx + bw - 10, by + 20);
  
  let cols = 3, cw = (bw - 20 - (cols - 1) * 12) / cols, ch = 70, sx = bx + 10, sy = by + 40;
  for (let i = 0; i < WEEKS.length; i++) {
    let col = i % cols, row = floor(i / cols);
    let rx = sx + col * (cw + 12), ry = sy + row * (ch + 12);
    let [r, g, b] = WEEKS[i].bookColor;
    
    fill(r, g, b, 15); stroke(r, g, b, 50); strokeWeight(1); drawRR(rx, ry, cw, ch, 6);
    noStroke(); textAlign(LEFT, TOP); textSize(cw * 0.12); fill(r, g, b); text("W" + WEEKS[i].week, rx + 10, ry + 10);
    textSize(cw * 0.1); fill(255, 255, 255, 190); text(WEEKS[i].title, rx + 10, ry + 30);
    textSize(cw * 0.08); fill(r, g, b, 160); text("完成 ✓", rx + 10, ry + 50);
  }
  
  textAlign(CENTER, CENTER); textSize(bw * 0.045); fill(255); text("期末完成！", cx, by + bh - 20);
  textSize(bw * 0.025); fill(255, 255, 255, 70); text("5 weeks · 5 projects · 1 journey", cx, by + bh + 5);
}

// ════════════════════════════════════════════════════════════
//  左側圖譜建立
// ════════════════════════════════════════════════════════════

function buildVineNodes() {
  vineNodes = [];
  let n = WEEKS.length, totalH = height * 0.65, startY = height * 0.8;
  for (let i = 0; i < n; i++) {
    let t = i / (n - 1), xOff = sin(t * PI * 1.4) * width * 0.04;
    vineNodes.push(new SeedNode(width / 6 + xOff, startY - t * totalH, WEEKS[i], i));
  }
}

function drawVineBg() {
  noStroke(); fill(35, 70, 18, 12); ellipse(width / 6, height * 0.06, width * 0.25, 55);
}

function drawVine() {
  if (vineNodes.length < 2) return;
  noFill();
  for (let pass = 0; pass < 3; pass++) {
    stroke(55, [95, 135, 170][pass], 28, [55, 95, 170][pass]); strokeWeight([3, 1.5, 0.5][pass]);
    beginShape(); vertex(width / 6, height - 8);
    for (let i = 0; i < vineNodes.length; i++) {
      let nd = vineNodes[i], wb = sin(timer * 1.1 + i * 0.75) * 9 * (1 - i / vineNodes.length * 0.4);
      curveVertex(nd.x + wb, nd.y);
    }
    let last = vineNodes[vineNodes.length - 1]; curveVertex(last.x, last.y - 38); endShape();
  }
  for (let i = 0; i < vineNodes.length; i++) {
    let nd = vineNodes[i], lx = nd.x + sin(timer + i) * 28, ly = nd.y - 18 - sin(timer * 0.65 + i) * 9;
    stroke(55, 135, 28, 65); strokeWeight(1); line(nd.x, nd.y, lx, ly);
    fill(55, 130, 28, 75); noStroke();
    beginShape(); vertex(lx, ly); vertex(lx + 11, ly - 7); vertex(lx + 5, ly - 18); vertex(lx - 7, ly - 11); endShape(CLOSE);
  }
}

function drawVineLabels() {
  noStroke(); fill(100, 195, 70, 170); textSize(11); textAlign(CENTER, BOTTOM);
  text("My Coding Growth", width / 6, height * 0.058);
  fill(70, 150, 45, 110); textSize(9); text("點擊節點開啟對應作品", width / 6, height * 0.058 + 13);
  fill(55, 115, 38, 85); textSize(8); textAlign(CENTER, CENTER);
  text("起點", width / 6, height * 0.87);
  if (vineNodes.length) text("期中", vineNodes[vineNodes.length - 1].x, vineNodes[vineNodes.length - 1].y - 42);
}

// ════════════════════════════════════════════════════════════
//  UI 建立與互動
// ════════════════════════════════════════════════════════════

function buildUI() {
  let topbar = document.createElement("div");
  topbar.id = "topbar";
  Object.assign(topbar.style, {
    position: "fixed", top: "0", left: "0", width: "100%", zIndex: "100",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "7px 16px", background: "rgba(6,10,15,0.96)",
    borderBottom: "1px solid rgba(0,200,100,0.15)", fontFamily: "monospace", boxSizing: "border-box",
  });
  topbar.innerHTML = `
    <span style="font-size:13px;color:#50e090;letter-spacing:2px">✦ INTERACTIVE PORTFOLIO</span>
    <span style="font-size:10px;color:rgba(0,200,100,.4);letter-spacing:1px">2024 學期作品</span>
  `;
  document.body.appendChild(topbar);

  // 常駐的展示區面板 (取代原本從右邊滑出的 preview)
  viewerPanel = document.createElement("div");
  viewerPanel.id = "viewer";
  Object.assign(viewerPanel.style, {
    position: "fixed", right: "0", top: "38px", width: "66.66vw", height: "calc(100vh - 38px)",
    background: "#040b05", borderLeft: "1px solid rgba(0,200,100,.2)",
    display: "flex", flexDirection: "column", zIndex: "80",
    opacity: "0", pointerEvents: "none", transition: "opacity 0.4s ease-in-out" // 加入淡入淡出效果
  });

  let ph = document.createElement("div");
  Object.assign(ph.style, {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "9px 13px", borderBottom: "1px solid rgba(0,200,100,.16)",
    background: "rgba(5,12,6,0.9)", flexShrink: "0", fontFamily: "monospace",
  });
  viewerTitle = document.createElement("span");
  viewerTitle.style.cssText = "font-size:12px;color:#50e090;letter-spacing:1px;font-weight:bold;";
  ph.appendChild(viewerTitle);

  iframeEl = document.createElement("iframe");
  iframeEl.style.cssText = "flex:1;border:none;background:#fff";
  iframeEl.sandbox = "allow-scripts allow-same-origin allow-forms allow-camera allow-microphone"; // 確保攝影機權限

  viewerPanel.appendChild(ph); viewerPanel.appendChild(iframeEl);
  document.body.appendChild(viewerPanel);

  // 底部導覽列 (確保 z-index 最高，不會被 iframe 蓋住)
  navEl = document.createElement("div");
  Object.assign(navEl.style, {
    position: "fixed", bottom: "14px", left: "66.66%", transform: "translateX(-50%)", 
    display: "flex", gap: "10px", zIndex: "150", 
    background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: "24px", backdropFilter: "blur(4px)"
  });
  let btnStyle = "padding:6px 18px;border-radius:18px;border:1px solid rgba(0,200,100,.4);background:rgba(0,200,100,.15);color:#50e090;font-size:12px;cursor:pointer;font-family:monospace;letter-spacing:.5px";
  prevBtn = document.createElement("button");
  prevBtn.textContent = "◀ 上一頁"; prevBtn.setAttribute("style", btnStyle); prevBtn.disabled = true;
  prevBtn.onclick = () => goTo(currentPage - 1);
  nextBtn = document.createElement("button");
  nextBtn.textContent = "下一頁 ▶"; nextBtn.setAttribute("style", btnStyle);
  nextBtn.onclick = () => goTo(currentPage + 1);
  navEl.appendChild(prevBtn); navEl.appendChild(nextBtn);
  document.body.appendChild(navEl);

  // Tooltip
  tooltipEl = document.createElement("div");
  Object.assign(tooltipEl.style, {
    position: "fixed", pointerEvents: "none", display: "none", zIndex: "200",
    background: "rgba(4,10,6,.94)", border: "1px solid rgba(0,200,100,.45)",
    color: "#80e890", fontSize: "11px", padding: "7px 11px", borderRadius: "7px", lineHeight: "1.65", fontFamily: "monospace",
  });
  document.body.appendChild(tooltipEl);

  let cnv = document.querySelector("canvas");
  if (cnv) { cnv.style.position = "fixed"; cnv.style.top = "38px"; cnv.style.left = "0"; }
}

function goTo(p) {
  if (p === currentPage || p < 0 || p >= BOOK_PAGES.length) return;
  currentPage = p;
  
  if (prevBtn) prevBtn.disabled = currentPage <= 0;
  if (nextBtn) nextBtn.disabled = currentPage >= BOOK_PAGES.length - 1;

  let pg = BOOK_PAGES[currentPage];
  
  if (pg.type === "week") {
    // 進入 Week 作品，顯示 iframe
    viewerTitle.textContent = `${pg.icon} Week ${pg.week} : ${pg.title} - ${pg.subtitle}`;
    iframeEl.src = pg.link;
    viewerPanel.style.opacity = "1";
    viewerPanel.style.pointerEvents = "auto";
  } else {
    // 進入 封面或總結，隱藏 iframe 顯示 p5 畫布內容
    viewerPanel.style.opacity = "0";
    viewerPanel.style.pointerEvents = "none";
    setTimeout(() => { if(currentPage === 0 || currentPage === BOOK_PAGES.length - 1) iframeEl.src = "about:blank"; }, 400); // 延遲清空確保過渡自然
  }
}

function updateTooltip() {
  if (!tooltipEl) return;
  if (hoverNode < 0) { tooltipEl.style.display = "none"; return; }
  let nd = vineNodes[hoverNode], d = nd.data;
  tooltipEl.style.display = "block";
  tooltipEl.style.left = (nd.x + 36) + "px";
  tooltipEl.style.top = (nd.y + 38 + 5) + "px";
  tooltipEl.innerHTML =
    "<b style='color:#90e870'>Week " + d.week + " " + d.icon + "</b><br>" +
    d.title + "<br>" +
    "<span style='color:#5ab840;font-size:10px'>" + d.subtitle + "</span><br>" +
    "<span style='color:#3a7a28;font-size:9px'>點擊直接開啟 ▶</span>";
}

// ════════════════════════════════════════════════════════════
//  p5.js 生命週期
// ════════════════════════════════════════════════════════════

function setup() {
  createCanvas(windowWidth, windowHeight - 38);
  buildUI();
  textFont("monospace");
  for (let i = 0; i < 40; i++) vineParticles.push(new VineParticle());
  for (let i = 0; i < 5; i++) roots.push(new Root(width / 6 + random(-25, 25), height - 16, random(-HALF_PI - 0.38, -HALF_PI + 0.38), 0));
  buildVineNodes();
}

function draw() {
  timer += 0.016;
  hoverNode = -1;

  background(7, 11, 15);
  
  stroke(0, 180, 255, 6); strokeWeight(1);
  for (let x = 0; x < width; x += 58) line(x, 0, x, height);
  for (let y = 0; y < height; y += 58) line(0, y, width, y);
  stroke(0, 200, 100, 20); line(width / 3, 0, width / 3, height); // 1/3 分界線

  // ── 左半部：時光圖譜 ──
  drawVineBg();
  vineParticles.forEach((pt) => { pt.update(); pt.draw(); });
  roots.forEach((r) => { r.update(); r.draw(); });
  if (roots.length < 100 && frameCount % 9 === 0 && frameCount < 350) {
    roots.push(new Root(width / 6 + random(-28, 28), height - 16, random(-HALF_PI - 0.45, -HALF_PI + 0.45), 0));
  }
  drawVine();
  vineNodes.forEach((nd) => { 
    nd.update(); nd.draw(); 
    if (nd.isHov()) hoverNode = nd.idx; 
  });
  drawVineLabels();

  // ── 右半部：狀態切換 (當 iframe 隱藏時才看得見) ──
  let pg = BOOK_PAGES[currentPage];
  if (pg.type === "cover") drawCover();
  else if (pg.type === "summary") drawSummary();

  // 頁碼文字對齊右半部的中心點
  noStroke(); fill(0, 200, 200, 65); textSize(10); textAlign(CENTER, CENTER);
  text((currentPage + 1) + " / " + BOOK_PAGES.length, width * (2 / 3), height - 10);

  updateTooltip();
  cursor(hoverNode >= 0 ? HAND : ARROW);
}

function mousePressed() {
  if (mouseX < width / 3) {
    if (hoverNode >= 0) {
      vineNodes[hoverNode].startBloom();
      goTo(vineNodes[hoverNode].data.week); // 直接觸發跳頁並顯示 iframe
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 38);
  vineParticles.forEach((pt) => pt.reset());
  roots = [];
  for (let i = 0; i < 5; i++) roots.push(new Root(width / 6 + random(-25, 25), height - 16, random(-HALF_PI - 0.38, -HALF_PI + 0.38), 0));
  buildVineNodes();
  if(navEl) navEl.style.left = "66.66%";
}