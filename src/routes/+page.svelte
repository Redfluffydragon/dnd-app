<script>
  import QRrious from 'qrious';
  import Column from '$lib/Column.svelte';
  import { ip } from '$lib/stores';
  import { browser } from '$app/environment';

  $: browser &&
    new QRrious({
      element: document.getElementById('controllerQR'),
      value: `http://${$ip}:8000/control`,
      size: Math.min(window.innerWidth, window.innerHeight) * 0.33,
    });
</script>

<svelte:head>
  <title>D&D App</title>
</svelte:head>

<main>
  <h1>D&D App</h1>
  <Column>
    <p class="app-only">
      To load a session or start a new session, go to <a href="/play">Play</a>
    </p>
    <p>
      To add a controller, go to <a href="/control"
        >{$ip ? `${$ip}:8000/control` : 'control'}</a
      >
      {#if $ip}
        <br /> or scan the QR code below
      {/if}
    </p>
    <canvas id="controllerQR" />
  </Column>
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
</style>
