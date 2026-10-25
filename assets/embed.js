(() => {
  const $ = id => document.getElementById(id);

  function url() {
    const u = new URL('widget.html', location.href);
    u.searchParams.set('theme', $('theme').value);
    u.searchParams.set('layout', $('layout').value);
    u.searchParams.set('pad', $('pad').value);
    return u.href;
  }
  function update() {
    const src = url();
    $('prev').src = src;
    $('code').textContent = '<iframe src="' + src + '" width="100%" height="380" style="border:0" allow="gamepad" title="Testador de controle"></iframe>';
  }
  ['theme', 'layout', 'pad'].forEach(id => { $(id).onchange = update; });
  $('copy').onclick = e => GP.copy($('code').textContent, e.currentTarget);
  update();
})();
