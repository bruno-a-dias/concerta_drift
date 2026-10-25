(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));
  let deadzone = 0.10, nBtn = -1, lastLayout = '', maxLT = 0, maxRT = 0;

  $('dz').addEventListener('input', e => { deadzone = +e.target.value; $('dzv').textContent = deadzone.toFixed(2); });
  $('resetMax').onclick = () => { maxLT = 0; maxRT = 0; };

  function build(n) {
    const el = $('btns'); el.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div'); d.className = 'btn'; d.id = 'b' + i;
      d.innerHTML = GP.label(i) + '<small>' + i + '</small>'; el.appendChild(d);
    }
    nBtn = n; lastLayout = GP.layout;
  }

  function stickInfo(x, y, el) {
    const m = Math.hypot(x, y);
    if (m < 0.02) el.innerHTML = '<span class="good">Centrado</span>';
    else if (m < deadzone) el.innerHTML = '<span class="warn">Dentro da zona morta: ' + m.toFixed(3) + '</span>';
    else el.innerHTML = 'Magnitude ' + m.toFixed(3) + (m > 1.02 ? ' <span class="warn">(&gt; 1: borda quadrada/octogonal)</span>' : '');
  }

  GP.loop(p => {
    if (!p) {
      $('info').textContent = 'Nenhum controle detectado. Conecte e pressione qualquer botão.';
      if (nBtn !== 0) { $('btns').innerHTML = ''; nBtn = 0; }
      GP.drawPad($('cL'), { x: 0, y: 0, deadzone });
      GP.drawPad($('cR'), { x: 0, y: 0, deadzone });
      return;
    }
    $('info').textContent = GP.info(p);
    if (p.buttons.length !== nBtn || GP.layout !== lastLayout) build(p.buttons.length);
    p.buttons.forEach((b, i) => { const el = $('b' + i); if (el) el.classList.toggle('on', b.pressed); });

    const ax = p.axes, lx = ax[0] || 0, ly = ax[1] || 0, rx = ax[2] || 0, ry = ax[3] || 0;
    GP.drawPad($('cL'), { x: lx, y: ly, deadzone });
    GP.drawPad($('cR'), { x: rx, y: ry, deadzone });
    $('tL').textContent = GP.fmt(lx) + ', ' + GP.fmt(ly);
    $('tR').textContent = GP.fmt(rx) + ', ' + GP.fmt(ry);
    stickInfo(lx, ly, $('eL')); stickInfo(rx, ry, $('eR'));

    const lt = p.buttons[6] ? p.buttons[6].value : 0, rt = p.buttons[7] ? p.buttons[7].value : 0;
    maxLT = Math.max(maxLT, lt); maxRT = Math.max(maxRT, rt);
    $('vLT').textContent = lt.toFixed(2); $('bLT').style.width = (lt * 100) + '%'; $('mLT').textContent = maxLT.toFixed(2);
    $('vRT').textContent = rt.toFixed(2); $('bRT').style.width = (rt * 100) + '%'; $('mRT').textContent = maxRT.toFixed(2);

    $('axes').innerHTML = '<b>Eixos</b>' + ax.map((v, i) => '<div><span>' + i + '</span><span>' + GP.fmt(v) + '</span></div>').join('');
    $('rbtns').innerHTML = '<b>Botões</b>' + p.buttons.map((b, i) => '<div><span>' + i + '</span><span>' + b.value.toFixed(2) + '</span></div>').join('');
  });
})();
