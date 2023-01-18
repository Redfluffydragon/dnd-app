<script>
  import '../app.scss';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { ip } from '$lib/stores';

  onMount(() => {
    // don't try to use IPC if the page is through the server
    if (!window.require) return;
    // notify main that the page is loaded
    ipc.send('ip', 'ready');

    // display qr code
    ipc.on('ip', (e, msg) => {
      $ip = msg;
    });
  });
</script>

<header>
  <div class="links">
    {#if !$page.route.id?.includes('control')}
      <a href="/">Home</a>
    {/if}
  </div>
</header>

<main>
  <slot />
</main>

<style>
  header {
    display: flex;
  }

  .links {
    padding: 1ch 2ch;
  }

  main {
    padding: 10px;
  }
</style>
