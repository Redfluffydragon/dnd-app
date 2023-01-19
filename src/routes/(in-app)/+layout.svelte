<script>
  import { onMount } from 'svelte';
  import { ip } from '$lib/stores';

  onMount(() => {
    // notify main that the page is loaded
    ipc.send('ip', 'ready');

    // display qr code
    ipc.on('ip', (e, msg) => {
      $ip = msg;
    });
  });
</script>

<nav />

<main>
  <slot />
</main>

<style>
  nav {
    -webkit-app-region: drag;
    background: var(--primary);
    height: env(titlebar-area-height);
    position: relative;
    z-index: 1000;
  }

  main {
    padding: 10px;
  }
</style>
