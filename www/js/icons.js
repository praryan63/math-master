/* ============================================================
   ALL ICONS LIVE HERE (inline SVG, stroke style)
   To add a new icon: add a path entry below, then use icon('name')
   ============================================================ */
const ICON_PATHS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  multiply: '<path d="M6 6l12 12M18 6L6 18"/>',
  'plus-minus': '<path d="M12 4v8M8 8h8"/><path d="M8 18h8"/>',
  'square-root': '<path d="M3 12.5h3.5l3 6.5 5-14h9.5"/>',
  percent: '<circle cx="7.5" cy="7.5" r="2.6"/><circle cx="16.5" cy="16.5" r="2.6"/><path d="M18 6L6 18"/>',
  sparkle: '<path d="M11 3l1.7 4.6L17.3 9.3l-4.6 1.7L11 15.6 9.3 11 4.7 9.3 9.3 7.6z"/><path d="M18 14.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z"/>',
  exclamation: '<path d="M10.3 4.4L2.7 17.5a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 4.4a2 2 0 00-3.4 0z"/><path d="M12 9.5v4.2"/><path d="M12 17.2h.01"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  book: '<path d="M4 5.2A2.7 2.7 0 016.7 2.5H20v16.8H6.7A2.7 2.7 0 004 22z"/><path d="M4 22a2.7 2.7 0 012.7-2.7H20"/>',
  'bar-chart': '<path d="M4 20h16"/><path d="M7.5 20v-6"/><path d="M12 20V8.5"/><path d="M16.5 20v-8.5"/>',
  'chevron-right': '<path d="M9.5 5l7 7-7 7"/>',
  'chevron-left': '<path d="M14.5 5l-7 7 7 7"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  'more-vertical': '<path d="M12 5.5h.01M12 12h.01M12 18.5h.01"/>',
  backspace: '<path d="M9 4.5h10.5a2 2 0 012 2v11a2 2 0 01-2 2H9L2.9 12z"/><path d="M12 9.3l5 5.4M17 9.3l-5 5.4"/>',
  check: '<path d="M4.6 12.6l4.8 4.8L19.4 6.9"/>',
  flame: '<path d="M12 21.2a6.2 6.2 0 006.2-6.2c0-4.1-3.1-6.7-4.7-9.7-1.5 2-1.5 3.6-1 4.6-1.5-1-2-2.6-2-4.1-2.3 2-4.7 4.6-4.7 9.2A6.2 6.2 0 0012 21.2z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.2v5.1l3.2 2"/>'
};

/* Build an <svg> string for a named icon */
function icon(name, extraClass){
  const path = ICON_PATHS[name] || '';
  return '<svg class="ico ' + (extraClass || '') + '" viewBox="0 0 24 24" fill="none" ' +
         'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
         'aria-hidden="true">' + path + '</svg>';
}