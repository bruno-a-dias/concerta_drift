(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));

  const NAMES = ['lx', 'ly', 'rx', 'ry'];
  const AX_LABEL = ['Esq. X', 'Esq. Y', 'Dir. X', 'Dir. Y'];
  const STEP_MS = { center: 2500, range: 8000 };
  let state = 'idle', t0 = 0, C, mn, mx, cal = null, lastId = '';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function norm(v, c) {
    const d = v >= c.center ? c.max - c.center : c.center - c.min;
    return clamp(d > 0.2 ? (v - c.center) / d : v - c.center, -1, 1);
  }
  function stick(x, y, cx, cy, dz) {
    const nx = norm(x, cx), ny = norm(y, cy), m = Math.hypot(nx, ny);
    if (m < dz) return [0, 0];
    const k = (Math.min(m, 1) - dz) / (1 - dz) / m;
    return [nx * k, ny * k];
  }

  function reset() {
    C = [[], [], [], []]; mn = [1e9, 1e9, 1e9, 1e9]; mx = [-1e9, -1e9, -1e9, -1e9];
  }
  reset();

  $('start').onclick = () => {
    const p = GP.pad();
    if (!p || p.axes.length < 4) { $('msg').textContent = 'Conecte um controle com ao menos 4 eixos e pressione um botão.'; return; }
    reset(); cal = null; state = 'center'; t0 = performance.now(); lastId = p.id;
    $('start').disabled = true; $('out').hidden = true; $('prevCard').hidden = true;
    $('msg').textContent = 'Passo 1/2 — solte os analógicos.';
  };

  function finish(p) {
    const axes = {}, warns = [];
    NAMES.forEach((n, i) => {
      axes[n] = { center: +GP.stats(C[i]).mean.toFixed(4), min: +mn[i].toFixed(4), max: +mx[i].toFixed(4) };
      if (mx[i] - mn[i] < 1.0) warns.push('O eixo ' + AX_LABEL[i] + ' percorreu só ' + (mx[i] - mn[i]).toFixed(2) + ' de 2.00. Gire até as bordas e refaça se quiser valores confiáveis.');
    });
    const dzOf = (a, b, ca, cb) => {
      const m = GP.stats(C[a].map((x, k) => Math.hypot(x - ca, C[b][k] - cb)));
      return Math.max(0.03, Math.ceil((m.p99 + 0.01) * 100) / 100);
    };
    cal = {
      id: p ? p.id : lastId, createdAt: new Date().toISOString(), axes,
      deadzone: { left: dzOf(0, 1, axes.lx.center, axes.ly.center), right: dzOf(2, 3, axes.rx.center, axes.ry.center) }
    };
    show();
    $('msg').textContent = 'Calibração concluída.';
    $('warns').innerHTML = warns.join('<br>');
  }

  function snippetText() {
    return 'const CAL = ' + JSON.stringify({ axes: cal.axes, deadzone: cal.deadzone }) + ';\n' +
      'const clamp = (v, a, b) => Math.max(a, Math.min(b, v));\n' +
      'function norm(v, c) {\n  const d = v >= c.center ? c.max - c.center : c.center - c.min;\n  return clamp(d > 0.2 ? (v - c.center) / d : v - c.center, -1, 1);\n}\n' +
      'function stick(x, y, cx, cy, dz) {\n  const nx = norm(x, cx), ny = norm(y, cy), m = Math.hypot(nx, ny);\n  if (m < dz) return [0, 0];\n  const k = (Math.min(m, 1) - dz) / (1 - dz) / m;\n  return [nx * k, ny * k];\n}\n' +
      '// uso:\n// const [x, y] = stick(pad.axes[0], pad.axes[1], CAL.axes.lx, CAL.axes.ly, CAL.deadzone.left);';
  }
  function show() {
    $('json').textContent = JSON.stringify(cal, null, 2);
    $('snippet').textContent = snippetText();
    $('out').hidden = false; $('prevCard').hidden = false;
  }

  $('copyJson').onclick = e => { if (cal) GP.copy(JSON.stringify(cal, null, 2), e.currentTarget); };
  $('copySnippet').onclick = e => { if (cal) GP.copy(snippetText(), e.currentTarget); };
  $('dlJson').onclick = () => { if (cal) GP.download('calibracao-controle.json', JSON.stringify(cal, null, 2), 'application/json'); };
  $('saveLocal').onclick = e => {
    if (!cal) return;
    const ok = GP.safe.set('cd.cal.' + (cal.id || 'padrao'), cal);
    const o = e.currentTarget.textContent; e.currentTarget.textContent = ok ? 'Salvo ✓' : 'Falhou';
    setTimeout(() => { e.currentTarget.textContent = o; }, 1200);
  };
  $('loadLocal').onclick = () => {
    const p = GP.pad(); const id = p ? p.id : lastId;
    const c = GP.safe.get('cd.cal.' + id, null);
    if (!c) { $('msg').textContent = 'Nenhuma calibração salva para este controle.'; return; }
    cal = c; show(); $('msg').textContent = 'Calibração salva carregada.';
  };

  GP.loop(p => {
    const a = p ? p.axes : [];
    if (state !== 'idle') {
      if (!p || p.axes.length < 4) { state = 'idle'; $('start').disabled = false; $('msg').textContent = 'Controle desconectado durante a calibração.'; }
      else {
        const f = Math.min(1, (performance.now() - t0) / STEP_MS[state]);
        if (state === 'center') {
          for (let i = 0; i < 4; i++) C[i].push(a[i]);
          $('prog').style.width = (f * 50) + '%';
          if (f >= 1) { state = 'range'; t0 = performance.now(); $('msg').textContent = 'Passo 2/2 — gire os analógicos pelas bordas, várias voltas.'; }
        } else {
          for (let i = 0; i < 4; i++) { mn[i] = Math.min(mn[i], a[i]); mx[i] = Math.max(mx[i], a[i]); }
          $('prog').style.width = (50 + f * 50) + '%';
          if (f >= 1) { state = 'idle'; $('start').disabled = false; finish(p); }
        }
      }
    }
    $('live').innerHTML = NAMES.map((n, i) => {
      const v = a[i] || 0, lo = mn[i] > 1e8 ? '—' : GP.fmt(mn[i]), hi = mx[i] < -1e8 ? '—' : GP.fmt(mx[i]);
      return '<tr><td>' + AX_LABEL[i] + '</td><td class="num">' + GP.fmt(v) + '</td><td class="num">' + lo + '</td><td class="num">' + hi + '</td></tr>';
    }).join('');

    if (cal && p && p.axes.length >= 4) {
      const L = $('which').value === 'l';
      const x = a[L ? 0 : 2] || 0, y = a[L ? 1 : 3] || 0;
      const cx = cal.axes[L ? 'lx' : 'rx'], cy = cal.axes[L ? 'ly' : 'ry'];
      const dz = L ? cal.deadzone.left : cal.deadzone.right;
      const q = stick(x, y, cx, cy, dz);
      GP.drawPad($('cRaw'), { x, y });
      GP.drawPad($('cCal'), { x: q[0], y: q[1] });
    }
  });
})();
