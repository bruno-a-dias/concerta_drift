(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));

  const SECTORS = 36, MAX_MS = 20000, MIN_R = 0.5;
  let running = false, t0 = 0;
  const mk = () => ({ pts: [], sec: new Array(SECTORS).fill(null) });
  let D = { l: mk(), r: mk() };

  function feed(d, x, y) {
    const r = Math.hypot(x, y);
    if (r < MIN_R) return;
    d.pts.push([x, y]); if (d.pts.length > 4000) d.pts.shift();
    let a = Math.atan2(y, x); if (a < 0) a += Math.PI * 2;
    const s = Math.min(SECTORS - 1, Math.floor(a / (Math.PI * 2) * SECTORS));
    if (!d.sec[s] || r > d.sec[s].r) d.sec[s] = { r, x, y };
  }

  function analyse(d) {
    const got = d.sec.filter(Boolean);
    const cover = got.length / SECTORS;
    if (got.length < 3) return { cover, n: got.length };
    const rs = got.map(q => q.r), st = GP.stats(rs);
    const dev = Math.max.apply(null, rs.map(v => Math.abs(v - st.mean))) / st.mean * 100;
    return { cover, n: got.length, mean: st.mean, min: st.min, max: st.max, rms: st.std / st.mean * 100, dev };
  }
  function polygon(d) { return d.sec.filter(Boolean).map(q => [q.x, q.y]); }

  function row(k, v, cls) { return '<tr><td>' + k + '</td><td class="num ' + (cls || '') + '">' + v + '</td></tr>'; }
  function render(el, a) {
    let h = row('Cobertura', Math.round(a.cover * 100) + '% (' + a.n + '/' + SECTORS + ')', a.cover >= 0.9 ? 'good' : 'warn');
    if (a.mean != null) {
      const cls = a.cover < 0.9 ? 'warn' : a.rms < 3 ? 'good' : a.rms < 6 ? 'warn' : 'bad';
      h += row('Raio médio', a.mean.toFixed(3)) + row('Raio mín. / máx.', a.min.toFixed(3) + ' / ' + a.max.toFixed(3)) +
        row('Erro RMS', a.rms.toFixed(1) + '%', cls) + row('Desvio máximo', a.dev.toFixed(1) + '%');
    }
    el.innerHTML = h;
  }

  $('toggle').onclick = () => {
    if (running) { running = false; $('toggle').textContent = 'Iniciar'; $('msg').textContent = 'Parado.'; return; }
    if (!GP.pad()) { $('msg').textContent = 'Nenhum controle detectado. Conecte e pressione um botão.'; return; }
    D = { l: mk(), r: mk() }; running = true; t0 = performance.now();
    $('toggle').textContent = 'Parar'; $('msg').textContent = 'Girando… empurre os analógicos até a borda.';
  };
  $('reset').onclick = () => { D = { l: mk(), r: mk() }; running = false; $('toggle').textContent = 'Iniciar'; $('prog').style.width = '0%'; $('msg').textContent = 'Limpo.'; };

  GP.loop(p => {
    let lx = 0, ly = 0, rx = 0, ry = 0;
    if (p) { lx = p.axes[0] || 0; ly = p.axes[1] || 0; rx = p.axes[2] || 0; ry = p.axes[3] || 0; }
    if (running) {
      if (!p) { running = false; $('toggle').textContent = 'Iniciar'; $('msg').textContent = 'Controle desconectado.'; }
      else {
        feed(D.l, lx, ly); feed(D.r, rx, ry);
        const f = Math.min(1, (performance.now() - t0) / MAX_MS);
        $('prog').style.width = (f * 100) + '%';
        if (f >= 1) { running = false; $('toggle').textContent = 'Iniciar'; $('msg').textContent = 'Concluído.'; }
      }
    }
    GP.drawPad($('cL'), { x: lx, y: ly, points: D.l.pts, polygon: polygon(D.l), pointAlpha: 0.35 });
    GP.drawPad($('cR'), { x: rx, y: ry, points: D.r.pts, polygon: polygon(D.r), pointAlpha: 0.35 });
    render($('rL'), analyse(D.l)); render($('rR'), analyse(D.r));
  });
})();
