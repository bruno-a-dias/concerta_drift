(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));

  const WINDOW = 1000, HIST_MAX = 30, BIN = 0.5;
  let running = true, lastTs = -1, lastSig = '', lastArr = 0;
  let stamps = [], intervals = [], series = [], peak = 0, lastSample = 0, total = 0;

  const sig = p => p.axes.join(',') + '|' + p.buttons.map(b => b.value).join(',');

  function onSample(p, now) {
    if (!running || !p) return;
    let changed, iv = null;
    if (p.timestamp > 0) {
      changed = p.timestamp !== lastTs;
      if (changed && lastTs >= 0) iv = p.timestamp - lastTs;
      lastTs = p.timestamp;
    } else {
      const s = sig(p); changed = s !== lastSig; lastSig = s;
      if (changed && lastArr) iv = now - lastArr;
    }
    if (!changed) return;
    lastArr = now; total++;
    stamps.push(now);
    if (iv != null && iv > 0 && iv < 100) { intervals.push(iv); if (intervals.length > 5000) intervals.shift(); }
  }
  GP.fastLoop(onSample);

  $('toggle').onclick = () => { running = !running; $('toggle').textContent = running ? 'Pausar' : 'Continuar'; };
  $('reset').onclick = () => { stamps = []; intervals = []; series = []; peak = 0; total = 0; lastTs = -1; lastSig = ''; lastArr = 0; };

  function drawChart() {
    const cv = $('chart'), c = cv.getContext('2d'), w = cv.width, h = cv.height, col = GP.colors();
    c.clearRect(0, 0, w, h);
    const max = Math.max(125, Math.ceil(Math.max.apply(null, series.concat([1])) / 125) * 125);
    c.strokeStyle = col.line; c.fillStyle = col.mut; c.font = '11px system-ui'; c.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 10 + (h - 30) * i / 4;
      c.beginPath(); c.moveTo(40, y); c.lineTo(w - 6, y); c.stroke();
      c.textAlign = 'right'; c.fillText(Math.round(max * (1 - i / 4)), 36, y + 4);
    }
    if (series.length < 2) return;
    c.strokeStyle = col.acc; c.lineWidth = 2; c.beginPath();
    series.forEach((v, i) => {
      const x = 40 + (w - 46) * i / (HIST_MAX * 4 - 1), y = 10 + (h - 30) * (1 - v / max);
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    });
    c.stroke();
  }

  function drawHist() {
    const cv = $('hist'), c = cv.getContext('2d'), w = cv.width, h = cv.height, col = GP.colors();
    c.clearRect(0, 0, w, h);
    const bins = new Array(Math.round(30 / BIN)).fill(0);
    intervals.forEach(v => { const i = Math.floor(v / BIN); if (i < bins.length) bins[i]++; });
    const m = Math.max.apply(null, bins.concat([1])), bw = (w - 40) / bins.length;
    c.fillStyle = col.acc;
    bins.forEach((n, i) => { const bh = (h - 30) * n / m; c.fillRect(30 + i * bw, h - 20 - bh, Math.max(1, bw - 1), bh); });
    c.fillStyle = col.mut; c.font = '11px system-ui'; c.textAlign = 'center';
    for (let ms = 0; ms <= 30; ms += 5) c.fillText(ms, 30 + (ms / BIN) * bw, h - 5);
  }

  function row(k, v) { return '<tr><td>' + k + '</td><td class="num">' + v + '</td></tr>'; }

  GP.loop(p => {
    const now = performance.now();
    while (stamps.length && now - stamps[0] > WINDOW) stamps.shift();
    const hz = stamps.length;
    if (running && now - lastSample >= 250) {
      lastSample = now; series.push(hz); if (series.length > HIST_MAX * 4) series.shift();
    }
    const idle = !stamps.length || now - stamps[stamps.length - 1] > 500;
    if (hz > peak) peak = hz;
    $('hz').textContent = (p && !idle) ? hz + ' Hz' : '— Hz';
    $('hint').textContent = !p ? 'Nenhum controle detectado.' : idle ? 'Aguardando movimento… mova um analógico em círculos.' : 'Medindo.';
    const st = GP.stats(intervals);
    $('stats').innerHTML = row('Pico (Hz)', peak || '—') + row('Relatórios contados', total) +
      (st ? row('Intervalo médio', st.mean.toFixed(2) + ' ms') + row('Mínimo / máximo', st.min.toFixed(2) + ' / ' + st.max.toFixed(2) + ' ms') +
        row('Jitter (desvio)', st.std.toFixed(2) + ' ms') + row('P99', st.p99.toFixed(2) + ' ms') : '');
    drawChart(); drawHist();
  });
})();
