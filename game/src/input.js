// DREDGEWARD input: one clear job — keyboard + mouse state, nothing else.
// WASD/arrows steer, mouse aims, click or SPACE fires the harpoon.
// ENTER starts/continues, R restarts from an end screen, P pauses, M mutes.
export function createInput() {
  return {
    keys: new Set(),
    mouseX: 640,
    mouseY: 360,
    mouseDown: false,
    pressed: new Set(), // keys pressed since last consume (edge-triggered)
    clicked: false, // mouse click since last consume
  };
}
export function attachInput(input, canvas) {
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (!e.repeat) input.pressed.add(k);
    input.keys.add(k);
  });
  addEventListener('keyup', (e) => input.keys.delete(e.key.toLowerCase()));
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.mouseX = ((e.clientX - r.left) / r.width) * 1280;
    input.mouseY = ((e.clientY - r.top) / r.height) * 720;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { input.mouseDown = true; input.clicked = true; }
  });
  addEventListener('mouseup', () => { input.mouseDown = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
export function consumePress(input, key) {
  if (input.pressed.has(key)) { input.pressed.delete(key); return true; }
  return false;
}
export function consumeClick(input) {
  if (input.clicked) { input.clicked = false; return true; }
  return false;
}
export function endFrameInput(input) {
  input.pressed.clear();
  input.clicked = false;
}
