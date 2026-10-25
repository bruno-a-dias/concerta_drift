/* Utilitários compartilhados: Gamepad API, navegação, desenho e estatística. */
(function () {
  'use strict';

  const LABELS = {
    xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'L3', 'R3', '↑', '↓', '←', '→', 'Xbox'],
    ps: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options', 'L3', 'R3', '↑', '↓', '←', '→', 'PS', 'Touchpad'],
    switch: ['B', 'A', 'Y', 'X', 'L', 'R', 'ZL', 'ZR', '−', '+', 'L3', 'R3', '↑', '↓', '←', '→', 'Home', 'Captura']
  };
  const LAYOUT_NAMES = { xbox: 'Xbox', ps: 'PlayStation', switch: 'Nintendo' };

  const PAGES = [
    ['index.html', 'Início'],
    ['drift.html', 'Drift'],
    ['calibration.html', 'Calibração'],
    ['circularity.html', 'Circularidade'],
    ['polling.html', 'Polling'],
    ['vibration.html', 'Vibração'],
    ['buttons.html', 'Botões'],
    ['mapping.html', 'Mapeamento'],
    ['latency.html', 'Reação'],
    ['guides.html', 'Guias'],
    ['embed.html', 'Widget']
  ];

  const safe = {
    get(k, d) {
      try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
    }
  };

  const GP = {
    LABELS, LAYOUT_NAMES, safe,
    active: Number(safe.get('cd.active', 0)) || 0,
    layout: LABELS[safe.get('cd.layout', 'xbox')] ? safe.get('cd.layout', 'xbox') : 'xbox',
    _bar: null, _sig: '', _col: null,

    pads() {
      try { return Array.from(navigator.getGamepads ? navigator.getGamepads() : []); } catch (e) { return []; }
    },
    pad() { return this.pads()[this.active] || null; },
    setActive(i) { this.active = i; safe.set('cd.active', i); this._sig = ''; },
    setLayout(l) { if (LABELS[l]) { this.layout = l; safe.set('cd.layout', l); this._sig = ''; } },
    label(i) { return LABELS[this.layout][i] || ('B' + i); },
    fmt(v, d) { d = d == null ? 2 : d; return (v >= 0 ? '+' : '') + v.toFixed(d); },
    info(p) {
      return p.id + ' — ' + p.buttons.length + ' botões, ' + p.axes.length + ' eixos, mapeamento: ' + (p.mapping || 'não padrão');
    },

    /* Barra com seleção de P1–P4 e do tipo de rótulos (Xbox/PlayStation/Nintendo). */
    mountBar(el) { this._bar = el; this._sig = ''; this.refreshBar(); },
    refreshBar() {
      const el = this._bar; if (!el) return;
      const pads = this.pads();
      const sig = pads.map(p => (p ? p.index : '-')).join(',') + '|' + this.active + '|' + this.layout;
      if (sig === this._sig) return;
      this._sig = sig;
      el.innerHTML = '';
      const row = document.createElement('div'); row.className = 'barrow';
      const slots = document.createElement('div'); slots.className = 'slots';
      for (let i = 0; i < 4; i++) {
        const b = document.createElement('button');
        b.className = 'slot' + (pads[i] ? ' has' : '') + (i === this.active ? ' active' : '');
        b.textContent = 'P' + (i + 1);
        b.onclick = () => GP.setActive(i);
        slots.appendChild(b);
      }
      row.appendChild(slots);
      const lab = document.createElement('label'); lab.className = 'note'; lab.textContent = 'Rótulos: ';
      const sel = document.createElement('select');
      Object.keys(LAYOUT_NAMES).forEach(k => {
        const o = document.createElement('option'); o.value = k; o.textContent = LAYOUT_NAMES[k];
        if (k === this.layout) o.selected = true; sel.appendChild(o);
      });
      sel.onchange = () => GP.setLayout(sel.value);
      lab.appendChild(sel); row.appendChild(lab);
      el.appendChild(row);
      if (window.isSecureContext === false) {
        const w = document.createElement('div'); w.className = 'note warn';
        w.textContent = 'Esta página não está em contexto seguro (HTTPS ou localhost); o navegador pode bloquear a Gamepad API.';
        el.appendChild(w);
      }
    },
    setStatus(p) {
      const s = document.getElementById('status'); if (!s) return;
      s.textContent = p ? 'Conectado' : 'Pressione um botão do controle';
      s.className = 'status' + (p ? ' on' : '');
    },

    /* Laço de interface (acompanha a taxa de atualização da tela). */
    loop(cb) {
      const self = this;
      function frame(t) {
        self.refreshBar();
        const p = self.pad();
        self.setStatus(p);
        try { cb(p, t); } catch (e) { console.error(e); }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    },
    /* Laço rápido via MessageChannel (muito mais frequente que requestAnimationFrame). */
    fastLoop(cb) {
      const ch = new MessageChannel(); let run = true;
      ch.port1.onmessage = () => {
        if (!run) return;
        try { cb(GP.pad(), performance.now()); } catch (e) { console.error(e); }
        ch.port2.postMessage(0);
      };
      ch.port2.postMessage(0);
      return () => { run = false; };
    },

    colors() {
      if (!this._col) {
        const s = getComputedStyle(document.documentElement);
        const g = n => s.getPropertyValue(n).trim() || '#888';
        this._col = { line: g('--line'), mut: g('--mut'), acc: g('--acc'), warn: g('--warn'), bad: g('--bad'), txt: g('--txt') };
      }
      return this._col;
    },

    /* Desenha um analógico. zoom=1 → borda do círculo = 1.0; zoom=0.25 → borda = 0.25. */
    drawPad(canvas, o) {
      o = o || {};
      const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2, r = w / 2 - 8, zoom = o.zoom || 1, col = this.colors();
      c.clearRect(0, 0, w, h);
      c.lineWidth = 1; c.strokeStyle = col.line;
      c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(cx, 8); c.lineTo(cx, h - 8); c.moveTo(8, cy); c.lineTo(w - 8, cy); c.stroke();
      if (zoom < 1) {
        c.fillStyle = col.mut; c.font = '11px system-ui'; c.textAlign = 'center';
        c.fillText('±' + zoom, cx, h - 12);
      }
      if (o.deadzone > 0) {
        c.save(); c.globalAlpha = 0.7; c.strokeStyle = col.warn; c.setLineDash([4, 3]);
        c.beginPath(); c.arc(cx, cy, Math.min(r, r * o.deadzone / zoom), 0, Math.PI * 2); c.stroke(); c.restore();
      }
      if (o.points && o.points.length) {
        c.save(); c.globalAlpha = o.pointAlpha || 0.5; c.fillStyle = col.acc;
        for (let i = 0; i < o.points.length; i++) {
          const q = o.points[i];
          c.fillRect(cx + q[0] / zoom * r - 1, cy + q[1] / zoom * r - 1, 2, 2);
        }
        c.restore();
      }
      if (o.polygon && o.polygon.length > 1) {
        c.save(); c.strokeStyle = col.warn; c.lineWidth = 1.5; c.beginPath();
        o.polygon.forEach((q, i) => {
          const px = cx + q[0] / zoom * r, py = cy + q[1] / zoom * r;
          if (i) c.lineTo(px, py); else c.moveTo(px, py);
        });
        c.closePath(); c.stroke(); c.restore();
      }
      if (o.x != null) {
        const mag = Math.hypot(o.x, o.y || 0);
        c.fillStyle = (o.deadzone > 0 && mag < o.deadzone) ? col.mut : col.acc;
        c.beginPath(); c.arc(cx + o.x / zoom * r, cy + (o.y || 0) / zoom * r, 6, 0, Math.PI * 2); c.fill();
      }
    },

    stats(a) {
      const n = a.length; if (!n) return null;
      let s = 0; for (const v of a) s += v;
      const mean = s / n; let q = 0; for (const v of a) q += (v - mean) * (v - mean);
      const so = a.slice().sort((x, y) => x - y);
      const pct = p => so[Math.min(n - 1, Math.max(0, Math.ceil(p / 100 * n) - 1))];
      return { n, mean, std: Math.sqrt(q / n), min: so[0], max: so[n - 1], median: pct(50), p99: pct(99), pct };
    },

    async copy(text, btn) {
      try { await navigator.clipboard.writeText(text); } catch (e) {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (_) { /* ignora */ }
        ta.remove();
      }
      if (btn) { const o = btn.textContent; btn.textContent = 'Copiado ✓'; setTimeout(() => { btn.textContent = o; }, 1200); }
    },
    download(name, text, type) {
      const b = new Blob([text], { type: type || 'text/plain' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },
    /* Vibração (dual-rumble). Lança erro se o navegador/controle não suportar. */
    vibrate(p, o) {
      const a = p && p.vibrationActuator;
      if (!a || !a.playEffect) throw new Error('Este navegador/controle não expõe vibração.');
      return a.playEffect(a.type || 'dual-rumble', {
        startDelay: o.delay || 0, duration: o.duration, strongMagnitude: o.strong, weakMagnitude: o.weak
      });
    }
  };

  /* Navegação */
  const nav = document.getElementById('nav');
  if (nav) {
    const cur = location.pathname.split('/').pop() || 'index.html';
    nav.innerHTML = PAGES.map(x => '<a href="' + x[0] + '"' + (x[0] === cur ? ' class="on"' : '') + '>' + x[1] + '</a>').join('');
  }

  window.GP = GP;
})();
