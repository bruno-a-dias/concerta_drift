(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));

  const N = 10, KEY = 'cd.reaction';
  let state = 'idle', round = 0, times = [], t0 = 0, timer = 0, prevDown = false;
  const box = $('box');

  function renderHist() {
    const h = GP.safe.get(KEY, []), g = {};
    h.forEach(s => { (g[s.conn] = g[s.conn] || []).push(s.mean); });
    const rows = Object.keys(g).map(k => {
      const a = g[k], m = a.reduce((x, y) => x + y, 0) / a.length;
      return '<tr><td>' + k + '</td><td class="num">' + a.length + '</td><td class="num">' + m.toFixed(0) + ' ms</td><td class="num">' + Math.min.apply(null, a).toFixed(0) + ' ms</td></tr>';
    });
    $('hist').innerHTML = rows.join('') || '<tr><td colspan="4" class="note">Sem histórico.</td></tr>';
  }
  renderHist();

  function show(msg, cls) { box.className = 'box' + (cls ? ' ' + cls : ''); box.textContent = msg; }

  function nextRound() {
    if (round >= N) { finish(); return; }
    state = 'wait'; show('Rodada ' + (round + 1) + '/' + N + ' — espere ficar verde…', 'wait');
    clearTimeout(timer);
    timer = setTimeout(() => {
      state = 'arming'; show('APERTE!', 'go');
      requestAnimationFrame(() => { t0 = performance.now(); state = 'go'; });
    }, 1500 + Math.random() * 2500);
  }

  function finish() {
    state = 'idle'; $('start').disabled = false;
    const st = GP.stats(times);
    show('Média: ' + st.mean.toFixed(0) + ' ms', '');
    $('res').innerHTML = 'Média <b>' + st.mean.toFixed(0) + ' ms</b> · mediana ' + st.median.toFixed(0) + ' ms · melhor ' + st.min.toFixed(0) +
      ' ms · pior ' + st.max.toFixed(0) + ' ms · desvio ' + st.std.toFixed(0) + ' ms<br><span class="note">' + times.map(t => t.toFixed(0)).join(' · ') + '</span>';
    const h = GP.safe.get(KEY, []);
    h.push({ conn: $('conn').value, mean: st.mean, date: Date.now() });
    GP.safe.set(KEY, h.slice(-100)); renderHist();
  }

  $('start').onclick = () => {
    if (!GP.pad()) { show('Conecte o controle e pressione um botão', ''); return; }
    times = []; round = 0; $('start').disabled = true; $('res').textContent = 'Em andamento…';
    nextRound();
  };
  $('clear').onclick = () => { GP.safe.set(KEY, []); renderHist(); };

  GP.fastLoop((p, now) => {
    const down = !!p && p.buttons.some(b => b.pressed);
    const edge = down && !prevDown; prevDown = down;
    if (!edge) return;
    if (state === 'wait') {
      clearTimeout(timer); state = 'cool'; show('Cedo demais! Espere ficar verde.', 'wait');
      setTimeout(nextRound, 1200);
    } else if (state === 'go') {
      const rt = now - t0; times.push(rt); round++; state = 'cool';
      show(rt.toFixed(0) + ' ms', '');
      setTimeout(nextRound, 900);
    }
  });

  GP.loop(() => { /* mantém barra e status atualizados */ });
})();
