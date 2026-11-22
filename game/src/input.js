// Keyboard + mouse input. Keys drive the thief; mouse clicks throw a coin
// or grab nearby loot; E fires the camera EMP. Exposes a plain state object
// the game loop reads each frame, plus one-shot click events.

export class Input {
  constructor(canvas) {
    this.keys = { up: false, down: false, left: false, right: false, sneak: false };
    this.clicks = [];   // queued {x, y} canvas clicks, consumed by main.js
    this.empPressed = false;
    this.anyKey = false;

    const keyMap = {
      KeyW: 'up', ArrowUp: 'up',
      KeyS: 'down', ArrowDown: 'down',
      KeyA: 'left', ArrowLeft: 'left',
      KeyD: 'right', ArrowRight: 'right',
      ShiftLeft: 'sneak', ShiftRight: 'sneak',
    };
    window.addEventListener('keydown', (e) => {
      this.anyKey = true;
      if (e.code === 'KeyE' && !e.repeat) this.empPressed = true;
      const k = keyMap[e.code];
      if (k) { this.keys[k] = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => {
      const k = keyMap[e.code];
      if (k) this.keys[k] = false;
    });
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      this.clicks.push({ x, y });
      this.anyKey = true;
    });
    // Keep arrow keys / space from scrolling the page.
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    });
  }

  takeClicks() {
    const c = this.clicks;
    this.clicks = [];
    return c;
  }

  takeEmp() {
    const v = this.empPressed;
    this.empPressed = false;
    return v;
  }
}
