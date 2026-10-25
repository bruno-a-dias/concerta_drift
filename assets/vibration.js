(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));
  let token = 0;

  const bind = (id, out, f) => { $(id).oninput = () => { $(out).textContent = f($(id).value); }; };
  bind('strong', 'vs', v => (+v).toFixed(2)); bind('weak', 'vw', v => (+v).toFixed(2)); bind('dur', 'vd', v => v);
  bind('tl', 'vl', v => (+v).toFixed(2)); bind('tr', 'vr', v => (+v).toFixed(2));

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rep = (n, step) => Array.from({ length: n }, () => step);
  const PATTERNS = {
    heavy: [{ s: 1, w: 0, d: 700 }],
    light: [{ s: 0, w: 1, d: 700 }],
    burst: rep(3, { s: 1, w: 1, d: 150, pause: 120 }),
    pulse: rep(3, { s: 0.6, w: 0.6, d: 300, pause: 250 }),
    wave: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].map(v => ({ s: v, w: v, d: 90 })),
    beat: rep(3, [{ s: 0.8, w: 0.8, d: 120, pause: 100 }, { s: 0.8, w: 0.8, d: 120, pause: 700 }]).reduce((a, b) => a.concat(b), []),
    alt: [{ s: 1, w: 0, d: 300, pause: 100 }, { s: 0, w: 1, d: 300, pause: 100 }, { s: 1, w: 0, d: 300, pause: 100 }, { s: 0, w: 1, d: 300 }]
  };

  function stopAll() {
    token++;
    const p = GP.pad();
    try { if (p && p.vibrationActuator && p.vibrationActuator.reset) p.vibrationActuator.reset(); } catch (e) { /* ignora */ }
  }

  async function run(steps) {
    const my = ++token;
    $('msg').textContent = '';
    for (const st of steps) {
      if (my !== token) return;
      try {
        await GP.vibrate(GP.pad(), { strong: st.s, weak: st.w, duration: st.d });
      } catch (e) { $('msg').textContent = e.message || 'Falha ao vibrar.'; return; }
      if (st.pause) await sleep(st.pause);
    }
  }

  $('play').onclick = () => run([{ s: +$('strong').value, w: +$('weak').value, d: +$('dur').value }]);
  $('stop').onclick = stopAll;
  document.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => run(PATTERNS[b.dataset.p]); });

  $('trig').onclick = async () => {
    const p = GP.pad(), a = p && p.vibrationActuator;
    if (!a || !a.playEffect) { $('tmsg').textContent = 'Nenhum atuador de vibração disponível.'; return; }
    try {
      await a.playEffect('trigger-rumble', { startDelay: 0, duration: 800, leftTrigger: +$('tl').value, rightTrigger: +$('tr').value, strongMagnitude: 0, weakMagnitude: 0 });
      $('tmsg').textContent = 'Comando enviado.';
    } catch (e) { $('tmsg').textContent = 'Não suportado neste controle/navegador.'; }
  };

  GP.loop(p => {
    const a = p && p.vibrationActuator;
    $('support').textContent = !p ? 'Nenhum controle detectado. Conecte e pressione um botão.'
      : (a && a.playEffect) ? 'Vibração disponível (tipo: ' + (a.type || 'dual-rumble') + ').'
        : 'Este navegador ou controle não expõe vibração. Tente Chrome/Edge com cabo USB.';
  });
})();
