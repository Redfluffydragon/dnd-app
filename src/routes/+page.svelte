<script>
  import { onMount } from 'svelte';
  import QRrious from 'qrious';

  let ip;

  onMount(() => {
    if (!window.require) return;
    // notify main that the page is loaded
    ipc.send('ip', 'ready');

    // display qr code
    ipc.on('ip', (e, msg) => {
      ip = msg;
      new QRrious({
        element: document.getElementById('controllerQR'),
        value: `http://${msg}:8000/control`,
        size: window.innerWidth * 0.33,
      });
    });
  });
</script>

<svelte:head>
  <title>D&D App</title>
</svelte:head>

<main>
  <h1>D&D App</h1>
  <div class="column">
    <p class="app-only">
      To start a new session, go to <a href="/play">Play</a>
    </p>
    <p>
      To add a controller, go to <a href="/control"
        >{ip ? `${ip}:8000/control` : 'control'}</a
      >
      {#if ip}
        <br /> or scan the QR code below
      {/if}
    </p>
    <canvas id="controllerQR" />
  </div>
</main>

<style lang="scss">
  :global(html[server] .app-only) {
    display: none;
  }

  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    text-transform: uppercase;
    font-size: 4rem;
    font-weight: 100;
    line-height: 1.1;
  }

  .column {
    display: grid;
    grid-template-columns: 1fr calc(100% - 44px) 1fr;
    place-items: center;
  }

  .column > * {
    grid-column: 2;
  }
</style>
