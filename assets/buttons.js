(() => {
  const $ = id => document.getElementById(id);
  GP.mountBar($('bar'));

  const BOUNCE_MS = 35;
  let B = [], prev = [];

  const blank = () => ({ down: false, count: 0, tDown: 0, tUp: 0, last: null, min: null, bounce: 0 });
  $('reset').onclick = () => { B = B.map(blank); };

  GP.fastLoop((p, now) => {
    if (!p) return;
    while (B.length < p.buttons.length) { B.push(blank()); prev.push(false); }
    p.buttons.forEach((b, i) => {
      const s = B[i], d = b.pressed;
      if (d && !s.down) {
        s.down = true; s.count++;
        if (s.tUp && now - s.tUp < BOUNCE_MS) s.bounce++;
        s.tDown = now;
      } else if (!d && s.down) {
        s.down = false; s.tUp = now;
        const hold = now - s.tDown; s.last = hold; s.min = s.min == null ? hold : Math.min(s.min, hold);
      }
    });
  });

  GP.loop(p => {
    if (!p) { $('tbody').innerHTML = '<tr><td colspan="6" class="note">Nenhum controle detectado.</td></tr>'; return; }
    $('tbody').innerHTML = B.map((s, i) => {
      const bc = s.bounce ? 'bad' : '';
      return '<tr><td>' + GP.label(i) + ' <span class="note">(' + i + ')</span></td>' +
        '<td>' + (s.down ? '<span class="good">Pressionado</span>' : '<span class="note">Solto</span>') + '</td>' +
        '<td class="num">' + s.count + '</td>' +
        '<td class="num">' + (s.last == null ? '—' : s.last.toFixed(0)) + '</td>' +
        '<td class="num">' + (s.min == null ? '—' : s.min.toFixed(0)) + '</td>' +
        '<td class="num ' + bc + '">' + s.bounce + '</td></tr>';
    }).join('');
  });
})();
