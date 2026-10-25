(() => {
  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  if (q.get('theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
  if (GP.LABELS[q.get('layout')]) GP.layout = q.get('layout');
  const padIndex = parseInt(q.get('pad'), 10);
  if (padIndex >= 0 && padIndex < 4) GP.active = padIndex;

  let nBtn = -1;
  function build(n) {
    const el = $('btns'); el.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div'); d.className = 'btn'; d.id = 'b' + i; d.textContent = GP.label(i); el.appendChild(d);
    }
    nBtn = n;
  }

  GP.loop(p => {
    if (!p) { if (nBtn !== 0) { $('btns').innerHTML = ''; nBtn = 0; } GP.drawPad($('cL'), { x: 0, y: 0 }); GP.drawPad($('cR'), { x: 0, y: 0 }); return; }
    if (p.buttons.length !== nBtn) build(p.buttons.length);
    p.buttons.forEach((b, i) => { const el = $('b' + i); if (el) el.classList.toggle('on', b.pressed); });
    GP.drawPad($('cL'), { x: p.axes[0] || 0, y: p.axes[1] || 0 });
    GP.drawPad($('cR'), { x: p.axes[2] || 0, y: p.axes[3] || 0 });
  });
})();
