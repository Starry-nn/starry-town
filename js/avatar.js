/* A small flat portrait of a guest avatar, used in the designer and in the private town. */
window.GuestAvatar = (() => {
  const SPECIES = [['cat', '🐱'], ['fox', '🦊'], ['bunny', '🐰'], ['bear', '🐻'], ['frog', '🐸']];
  const FUR = ['#f6c89f', '#f7f2ea', '#c99a6b', '#f29a52', '#8fd67c', '#b9b3c4', '#ffd9e6', '#8d6e63'];
  const SHIRT = ['#7fd1c0', '#f590b2', '#6f8fd8', '#ffd166', '#b79cf0', '#f0766a'];
  const hex = v => /^#[0-9a-fA-F]{6}$/.test(v);
  function clean(d) {                 // never trust stored or received values
    d = d || {};
    return { name: String(d.name || '').replace(/[<>]/g, '').trim().slice(0, 24), species: SPECIES.some(s => s[0] === d.species) ? d.species : 'cat',
      color: hex(d.color) ? d.color : FUR[0], accent: hex(d.accent) ? d.accent : SHIRT[0] };
  }
  function svg(d, size = 96) {
    d = clean(d);
    const ears = { cat: '<path d="M22 30l4-18 14 10zM74 30l-4-18-14 10z"/>', fox: '<path d="M20 32l2-24 18 14zM76 32l-2-24-18 14z"/>',
      bunny: '<rect x="30" y="0" width="12" height="34" rx="6"/><rect x="54" y="0" width="12" height="34" rx="6"/>',
      bear: '<circle cx="26" cy="22" r="10"/><circle cx="70" cy="22" r="10"/>', frog: '<circle cx="32" cy="20" r="11"/><circle cx="64" cy="20" r="11"/>' }[d.species];
    const eyeY = d.species === 'frog' ? 20 : 44, eyeX = d.species === 'frog' ? 16 : 13;
    return `<svg viewBox="0 0 96 96" width="${size}" height="${size}" aria-hidden="true"><ellipse cx="48" cy="84" rx="26" ry="16" fill="${d.accent}"/><g fill="${d.color}">${ears}<ellipse cx="48" cy="46" rx="30" ry="27"/></g>
      <ellipse cx="48" cy="56" rx="12" ry="8" fill="#fff" opacity=".75"/><circle cx="${48 - eyeX}" cy="${eyeY}" r="4" fill="#3d3848"/><circle cx="${48 + eyeX}" cy="${eyeY}" r="4" fill="#3d3848"/><circle cx="48" cy="53" r="2.6" fill="#3d3848"/>
      <path d="M43 58q5 5 10 0" fill="none" stroke="#3d3848" stroke-width="2" stroke-linecap="round"/><circle cx="28" cy="54" r="5" fill="#ff9db8" opacity=".6"/><circle cx="68" cy="54" r="5" fill="#ff9db8" opacity=".6"/></svg>`;
  }
  return { SPECIES, FUR, SHIRT, clean, svg, icon: sp => (SPECIES.find(s => s[0] === sp) || SPECIES[0])[1] };
})();
