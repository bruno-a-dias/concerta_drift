(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));

  const STEPS = [
    { k: 'face_bottom', t: 'Botão frontal de baixo (A / ✕ / B)', std: 0 },
    { k: 'face_right', t: 'Botão frontal da direita (B / ○ / A)', std: 1 },
    { k: 'face_left', t: 'Botão frontal da esquerda (X / □ / Y)', std: 2 },
    { k: 'face_top', t: 'Botão frontal de cima (Y / △ / X)', std: 3 },
    { k: 'l1', t: 'Ombro esquerdo (LB / L1 / L)', std: 4 },
    { k: 'r1', t: 'Ombro direito (RB / R1 / R)', std: 5 },
    { k: 'l2', t: 'Gatilho esquerdo (LT / L2 / ZL)', std: 6, axis: true },
    { k: 'r2', t: 'Gatilho direito (RT / R2 / ZR)', std: 7, axis: true },
    { k: 'select', t: 'Botão de voltar (View / Create / −)', std: 8 },
    { k: 'start', t: 'Botão de iniciar (Menu / Options / +)', std: 9 },
    { k: 'l3', t: 'Clique do analógico esquerdo (L3)', std: 10 },
    { k: 'r3', t: 'Clique do analógico direito (R3)', std: 11 },
    { k: 'dpad_up', t: 'Direcional ↑', std: 12, axis: true },
    { k: 'dpad_down', t: 'Direcional ↓', std: 13, axis: true },
    { k: 'dpad_left', t: 'Direcional ←', std: 14, axis: true },
    { k: 'dpad_right', t: 'Direcional →', std: 15, axis: true },
    { k: 'home', t: 'Botão central (Xbox / PS / Home)', std: 16 },
    { k: 'lx', t: 'Analógico esquerdo: empurre para a DIREITA', std: 0, type: 'axis' },
    { k: 'ly', t: 'Analógico esquerdo: empurre para BAIXO', std: 1, type: 'axis' },
    { k: 'rx', t: 'Analógico direito: empurre para a DIREITA', std: 2, type: 'axis' },
    { k: 'ry', t: 'Analógico direito: empurre para BAIXO', std: 3, type: 'axis' }
  ];

  let idx = -1, armed = false, base = [], used = new Set(), R = {}, last = null;

  const fmtDet = d => d == null ? '—' : d.button != null ? 'botão ' + d.button : 'eixo ' + d.axis + (d.dir > 0 ? ' (+)' : ' (−)');
  const fmtStd = s => (s.type === 'axis' ? 'eixo ' : 'botão ') + s.std;

  function begin() {
    if (!GP.pad()) { $('hint').textContent = 'Nenhum controle detectado. Conecte e pressione um botão.'; return; }
    idx = 0; armed = false; used = new Set(); R = {};
    $('start').disabled = true; $('skip').disabled = false; $('cancel').disabled = false; $('out').hidden = true;
  }
  function stop() {
    idx = -1; $('start').disabled = false; $('skip').disabled = true; $('cancel').disabled = true;
    $('prompt').textContent = 'Pronto para começar.'; $('hint').textContent = ''; $('prog').style.width = '0%';
  }
  function next() { idx++; armed = false; if (idx >= STEPS.length) done(); }

  function done() {
    const p = GP.pad();
    idx = -1; $('start').disabled = false; $('skip').disabled = true; $('cancel').disabled = true;
    $('prompt').textContent = 'Concluído.'; $('hint').textContent = ''; $('prog').style.width = '100%';
    $('tbody').innerHTML = STEPS.map(s => {
      const d = R[s.k];
      let st, cls;
      if (d == null) { st = 'Pulado'; cls = 'note'; }
      else if (s.type === 'axis') { st = d.axis === s.std ? 'Igual ao padrão' : 'Diferente'; cls = d.axis === s.std ? 'good' : 'warn'; }
      else { st = d.button === s.std ? 'Igual ao padrão' : 'Diferente'; cls = d.button === s.std ? 'good' : 'warn'; }
      return '<tr><td>' + s.t + '</td><td class="num">' + fmtDet(d) + '</td><td class="num">' + fmtStd(s) + '</td><td class="' + cls + '">' + st + '</td></tr>';
    }).join('');
    $('out').hidden = false;
    $('out').dataset.json = JSON.stringify({ id: p ? p.id : '', mapping: p ? p.mapping : '', results: R }, null, 2);
  }

  $('start').onclick = begin;
  $('cancel').onclick = stop;
  $('skip').onclick = () => { if (idx >= 0) { R[STEPS[idx].k] = null; next(); } };
  $('copy').onclick = e => GP.copy($('out').dataset.json || '', e.currentTarget);
  $('dl').onclick = () => GP.download('mapeamento-controle.json', $('out').dataset.json || '{}', 'application/json');

  GP.loop(p => {
    if (!p) { $('info').textContent = 'Nenhum controle detectado.'; $('last').textContent = '—'; $('down').textContent = ''; return; }
    $('info').textContent = GP.info(p);
    const downs = [];
    p.buttons.forEach((b, i) => { if (b.pressed) { downs.push(i); last = i; } });
    $('last').textContent = last == null ? '—' : last + ' (' + GP.label(last) + ')';
    $('down').textContent = downs.length ? 'Pressionados agora: ' + downs.map(i => i + ' (' + GP.label(i) + ')').join(', ') : '';

    if (idx < 0) return;
    const s = STEPS[idx];
    $('prompt').textContent = s.t;
    $('prog').style.width = (idx / STEPS.length * 100) + '%';

    if (!armed) {
      if (downs.length === 0) { armed = true; base = p.axes.slice(); $('hint').textContent = 'Passo ' + (idx + 1) + ' de ' + STEPS.length + '.'; }
      else $('hint').textContent = 'Solte todos os botões para continuar.';
      return;
    }

    let found = null;
    if (s.type === 'axis') {
      p.axes.forEach((v, i) => {
        if (!found && !used.has('a' + i) && Math.abs(v - (base[i] || 0)) > 0.7) found = { axis: i, dir: v - (base[i] || 0) > 0 ? 1 : -1 };
      });
    } else {
      p.buttons.forEach((b, i) => { if (!found && b.pressed && !used.has('b' + i)) found = { button: i }; });
      if (!found && s.axis) {
        p.axes.forEach((v, i) => {
          if (!found && !used.has('a' + i) && Math.abs(v - (base[i] || 0)) > 0.5) found = { axis: i, dir: v - (base[i] || 0) > 0 ? 1 : -1 };
        });
      }
    }
    if (found) {
      used.add(found.button != null ? 'b' + found.button : 'a' + found.axis);
      R[s.k] = found; next();
    }
  });
})();
