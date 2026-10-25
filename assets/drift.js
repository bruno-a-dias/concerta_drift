(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));
  let state = 'idle', t0 = 0, dur = 5000, S = { l: [], r: [] }, R = null;

  const zoomOf = () => +$('zoom').value;
  const dzOf = () => +$('dz').value;
  $('dz').oninput = () => { $('dzv').textContent = dzOf().toFixed(2); };

  $('start').onclick = () => {
    if (!GP.pad()) { $('msg').textContent = 'Nenhum controle detectado. Conecte e pressione um botão antes de medir.'; return; }
    dur = +$('dur').value * 1000; S = { l: [], r: [] }; R = null; state = 'run'; t0 = performance.now();
    $('res').hidden = true; $('start').disabled = true; $('prog').style.width = '0%';
    $('msg').textContent = 'Medindo… solte os analógicos e não toque no controle.';
  };

  function analyse(pts) {
    const sx = GP.stats(pts.map(q => q[0])), sy = GP.stats(pts.map(q => q[1]));
    const sm = GP.stats(pts.map(q => Math.hypot(q[0], q[1])));
    const sug = Math.max(0.05, Math.ceil((sm.p99 + 0.01) * 100) / 100);
    let level, cls, moved = false;
    if (sm.max > 0.5 || sx.std > 0.05 || sy.std > 0.05) { level = 'Movimento detectado — repita'; cls = 'warn'; moved = true; }
    else if (sm.p99 < 0.03) { level = 'Sem drift relevante'; cls = 'good'; }
    else if (sm.p99 < 0.08) { level = 'Drift leve'; cls = 'warn'; }
    else if (sm.p99 < 0.15) { level = 'Drift moderado'; cls = 'warn'; }
    else { level = 'Drift severo'; cls = 'bad'; }
    return { n: sm.n, ox: sx.mean, oy: sy.mean, sdx: sx.std, sdy: sy.std, mean: sm.mean, p99: sm.p99, max: sm.max, sug, level, cls, moved };
  }

  function finish() {
    state = 'idle'; $('start').disabled = false; $('prog').style.width = '100%';
    R = { l: analyse(S.l), r: analyse(S.r) };
    const rows = [
      ['Amostras', a => a.n],
      ['Offset X', a => GP.fmt(a.ox, 4)],
      ['Offset Y', a => GP.fmt(a.oy, 4)],
      ['Desvio padrão X', a => a.sdx.toFixed(4)],
      ['Desvio padrão Y', a => a.sdy.toFixed(4)],
      ['Magnitude média', a => a.mean.toFixed(4)],
      ['Magnitude P99', a => a.p99.toFixed(4)],
      ['Magnitude máxima', a => a.max.toFixed(4)],
      ['Zona morta sugerida', a => '<b>' + a.sug.toFixed(2) + '</b>'],
      ['Diagnóstico', a => '<span class="badge ' + a.cls + '">' + a.level + '</span>']
    ];
    $('tbody').innerHTML = rows.map(r => '<tr><td>' + r[0] + '</td><td class="num">' + r[1](R.l) + '</td><td class="num">' + r[1](R.r) + '</td></tr>').join('');
    $('legend').textContent = 'A taxa de amostragem acompanha a atualização da tela, então o número de amostras varia entre computadores.';
    $('res').hidden = false;
    $('msg').textContent = (R.l.moved || R.r.moved) ? 'Parece que um analógico foi movido durante a medição. Repita sem tocar no controle.' : 'Medição concluída.';
  }

  function text() {
    const f = (n, a) => n + ': offset ' + GP.fmt(a.ox, 4) + ', ' + GP.fmt(a.oy, 4) + ' | P99 ' + a.p99.toFixed(4) + ' | zona morta sugerida ' + a.sug.toFixed(2) + ' | ' + a.level;
    const p = GP.pad();
    return (p ? p.id + '\n' : '') + f('Esquerdo', R.l) + '\n' + f('Direito', R.r);
  }
  $('copy').onclick = e => { if (R) GP.copy(text(), e.currentTarget); };

  GP.loop(p => {
    let lx = 0, ly = 0, rx = 0, ry = 0;
    if (p) { lx = p.axes[0] || 0; ly = p.axes[1] || 0; rx = p.axes[2] || 0; ry = p.axes[3] || 0; }
    if (state === 'run') {
      if (!p) { state = 'idle'; $('start').disabled = false; $('msg').textContent = 'Controle desconectado durante a medição.'; }
      else {
        S.l.push([lx, ly]); S.r.push([rx, ry]);
        const f = Math.min(1, (performance.now() - t0) / dur);
        $('prog').style.width = (f * 100) + '%';
        if (f >= 1) finish();
      }
    }
    const z = zoomOf(), dz = dzOf();
    GP.drawPad($('cL'), { x: lx, y: ly, deadzone: dz, zoom: z, points: S.l });
    GP.drawPad($('cR'), { x: rx, y: ry, deadzone: dz, zoom: z, points: S.r });
    $('tL').textContent = GP.fmt(lx, 3) + ', ' + GP.fmt(ly, 3);
    $('tR').textContent = GP.fmt(rx, 3) + ', ' + GP.fmt(ry, 3);
  });
})();
