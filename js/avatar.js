/* Guest avatars: the choices on offer, validation, and a small flat portrait used in the designer. */
window.GuestAvatar = (() => {
  const SPECIES = [['cat', '🐱'], ['dog', '🐶'], ['fox', '🦊'], ['bunny', '🐰'], ['bear', '🐻'], ['panda', '🐼'], ['frog', '🐸']];
  const FUR = ['#f6c89f', '#f7f2ea', '#c99a6b', '#f29a52', '#8fd67c', '#b9b3c4', '#ffd9e6', '#8d6e63', '#ffe08a', '#a8d8f0'];
  const SHIRT = ['#7fd1c0', '#f590b2', '#6f8fd8', '#ffd166', '#b79cf0', '#f0766a', '#5d5b8a', '#fffaf0'];
  const ACC = [['none', '✕'], ['cap', '🧢'], ['bow', '🎀'], ['crown', '👑'], ['flower', '🌸'], ['glasses', '👓'], ['scarf', '🧣']];
  const hex = v => /^#[0-9a-fA-F]{6}$/.test(v);
  function clean(d) {                 // never trust stored or received values
    d = d || {};
    return { name: String(d.name || '').replace(/[<>]/g, '').trim().slice(0, 24), species: SPECIES.some(s => s[0] === d.species) ? d.species : 'cat',
      color: hex(d.color) ? d.color : FUR[0], accent: hex(d.accent) ? d.accent : SHIRT[0], acc: ACC.some(a => a[0] === d.acc) ? d.acc : 'none',
      line: String(d.line || '').replace(/[<>]/g, '').trim().slice(0, 60) };
  }
  function svg(d, size = 96) {
    d = clean(d);
    const dark = '#4a4458', sp = d.species;
    const ears = { cat: '<path d="M22 32l3-20 16 11zM74 32l-3-20-16 11z"/>', fox: '<path d="M20 34l1-26 19 15zM76 34l-1-26-19 15z"/>',
      bunny: '<rect x="30" y="0" width="12" height="36" rx="6"/><rect x="54" y="0" width="12" height="36" rx="6"/>',
      bear: '<circle cx="25" cy="23" r="10"/><circle cx="71" cy="23" r="10"/>', panda: `<g fill="${dark}"><circle cx="25" cy="23" r="10"/><circle cx="71" cy="23" r="10"/></g>`,
      dog: '<ellipse cx="19" cy="44" rx="8" ry="17" transform="rotate(14 19 44)"/><ellipse cx="77" cy="44" rx="8" ry="17" transform="rotate(-14 77 44)"/>',
      frog: '<circle cx="32" cy="21" r="11"/><circle cx="64" cy="21" r="11"/>' }[sp];
    const eyeY = sp === 'frog' ? 21 : 45, eyeX = sp === 'frog' ? 16 : 13;
    const acc = { none: '', cap: `<path d="M22 30a26 20 0 0 1 52 0z" fill="${d.accent}" stroke="#fff" stroke-width="2"/><rect x="48" y="26" width="34" height="6" rx="3" fill="${d.accent}"/>`,
      bow: '<path d="M64 14l14-7v14zM64 14l-14-7v14z" fill="#f590b2"/><circle cx="64" cy="14" r="4" fill="#e27aa0"/>',
      crown: '<path d="M30 24l4-16 8 9 6-12 6 12 8-9 4 16z" fill="#ffd166" stroke="#f5b01a" stroke-width="1.5"/>',
      flower: '<g fill="#ff9db8"><circle cx="70" cy="18" r="5"/><circle cx="79" cy="22" r="5"/><circle cx="76" cy="31" r="5"/><circle cx="66" cy="29" r="5"/></g><circle cx="73" cy="25" r="4" fill="#ffd166"/>',
      glasses: `<g fill="none" stroke="${dark}" stroke-width="2.5"><circle cx="${48 - eyeX}" cy="${eyeY}" r="8"/><circle cx="${48 + eyeX}" cy="${eyeY}" r="8"/><path d="M${48 - eyeX + 8} ${eyeY}h${eyeX * 2 - 16}"/></g>`,
      scarf: '<path d="M26 70q22 10 44 0v8q-22 10-44 0z" fill="#f0766a"/><rect x="58" y="74" width="9" height="16" rx="3" fill="#f0766a"/>' }[d.acc];
    return `<svg viewBox="0 0 96 96" width="${size}" height="${size}" aria-hidden="true"><ellipse cx="48" cy="86" rx="27" ry="17" fill="${d.accent}"/><ellipse cx="48" cy="92" rx="15" ry="8" fill="#fff" opacity=".18"/>
      <g fill="${d.color}">${ears}<ellipse cx="48" cy="47" rx="30" ry="27"/></g><ellipse cx="38" cy="34" rx="14" ry="8" fill="#fff" opacity=".22"/>
      ${sp === 'panda' ? `<ellipse cx="35" cy="45" rx="8" ry="10" fill="${dark}" transform="rotate(-14 35 45)"/><ellipse cx="61" cy="45" rx="8" ry="10" fill="${dark}" transform="rotate(14 61 45)"/>` : ''}
      <ellipse cx="48" cy="57" rx="12" ry="8" fill="#fff" opacity=".8"/>
      <circle cx="${48 - eyeX}" cy="${eyeY}" r="4.2" fill="${sp === 'panda' ? '#fff' : '#3d3848'}"/><circle cx="${48 + eyeX}" cy="${eyeY}" r="4.2" fill="${sp === 'panda' ? '#fff' : '#3d3848'}"/>
      <circle cx="${48 - eyeX + 1.4}" cy="${eyeY - 1.4}" r="1.3" fill="${sp === 'panda' ? '#3d3848' : '#fff'}"/><circle cx="${48 + eyeX + 1.4}" cy="${eyeY - 1.4}" r="1.3" fill="${sp === 'panda' ? '#3d3848' : '#fff'}"/>
      <ellipse cx="48" cy="54" rx="3" ry="2.3" fill="#3d3848"/><path d="M43 59q5 5 10 0" fill="none" stroke="#3d3848" stroke-width="2" stroke-linecap="round"/>
      <circle cx="27" cy="55" r="5" fill="#ff9db8" opacity=".6"/><circle cx="69" cy="55" r="5" fill="#ff9db8" opacity=".6"/>${acc}</svg>`;
  }
  return { SPECIES, FUR, SHIRT, ACC, clean, svg, icon: sp => (SPECIES.find(s => s[0] === sp) || SPECIES[0])[1] };
})();
