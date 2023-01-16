<script>
  import { createEventDispatcher } from 'svelte';

  let center = {};
  let container;
  let position = {
    x: 0,
    y: 0,
  };
  let limit;
  let send;

  const dispatch = createEventDispatcher();

  function calcPosition(coords) {
    const diff = {
      x: coords.x - center.x,
      y: coords.y - center.y,
    };
    const angle = Math.atan2(diff.y, diff.x);
    return {
      x:
        Math.min(Math.abs(diff.x), Math.abs(Math.cos(angle) * limit)) *
        Math.sign(diff.x),
      y:
        Math.min(Math.abs(diff.y), Math.abs(Math.sin(angle) * limit)) *
        Math.sign(diff.y),
    };
  }

  function handleMove(e) {
    e.preventDefault();
    position = calcPosition({
      x: e.touches?.[0].clientX || e.x,
      y: e.touches?.[0].clientY || e.y,
    });
  }

  function setup() {
    // Get center every time in case of scrolling?
    const box = container.getBoundingClientRect();
    center = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };
    limit = box.width / 2;
    sendSignal();
  }

  function reset() {
    position = { x: 0, y: 0 };
    document.removeEventListener('touchmove', handleMove, { passive: false });
    document.removeEventListener('mousemove', handleMove, { passive: false });
    cancelAnimationFrame(send);
  }

  function sendSignal() {
    dispatch('input', {
      x: position.x / limit,
      y: position.y / limit,
    });
    send = requestAnimationFrame(sendSignal);
  }
</script>

<div
  class="joystick"
  bind:this={container}
  on:touchstart={(e) => {
    e.preventDefault();
    setup();

    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', reset, { once: true });
    document.addEventListener('touchcancel', reset, { once: true });
  }}
  on:mousedown={() => {
    setup();

    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('mouseup', reset, { once: true });
  }}
>
  <div
    class="stick"
    style="transform: translate(calc(-50% + {position.x}px), calc(-50% + {position.y}px));"
  />
</div>

<style>
  .joystick,
  .stick {
    aspect-ratio: 1;
    border-radius: 50%;
    border: 3px solid black;
  }

  .joystick {
    background: rgba(0, 0, 0, 0.249);
    width: 6em;
    position: relative;
  }

  .stick {
    background: rgba(0, 0, 0, 0.786);
    width: 2em;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
  }
</style>
