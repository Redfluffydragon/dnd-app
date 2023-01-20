<script>
  import { onMount } from 'svelte';
  import { ip, port } from '$lib/stores';
  import AppMenu from '$lib/app/AppMenu.svelte';
  import Menu from '$lib/Menu.svelte';
  import { players, session } from '$lib/stores';
  import PlayerList from '$lib/PlayerList.svelte';

  onMount(() => {
    // For dev, set the port to 3000
    if (location.host.includes('localhost')) {
      $port = ':3000';
    }

    // notify main that the page is loaded
    ipc.send('ip', 'ready');

    // display qr code
    ipc.on('ip', (e, msg) => {
      $ip = msg;
    });
  });
</script>

<nav />

<div class="multimenu">
  <AppMenu />
  <Menu>
    <svg slot="icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path
        d="M23.7474 0V48M0 23.04H48"
        stroke="currentColor"
        stroke-width="5"
      />
    </svg>

    <li><p>Hi</p></li>
  </Menu>
  <Menu>
    <svg
      slot="icon"
      width="54"
      height="54"
      viewBox="0 0 54 54"
      fill="currentColor"
    >
      <path
        d="M35,18.5 C35,23.194 31.194,27 26.5,27 C21.806,27 18,23.194 18,18.5 C18,13.806 21.806,10 26.5,10 C31.194,10 35,13.806 35,18.5 Z"
      />
      <path
        d="M47.176,44.177 C45.929,39.856 43.328,36.049 39.755,33.318 C36.183,30.586 31.827,29.073 27.331,29.003 C22.834,28.932 18.433,30.306 14.776,32.924 C11.119,35.542 8.399,39.265 7.017,43.544 L27,50 L47.176,44.177 Z"
      />
      <path
        d="M0.5,27 C0.5,12.365 12.365,0.5 27,0.5 C41.636,0.5 53.5,12.365 53.5,27 C53.5,41.636 41.636,53.5 27,53.5 C12.365,53.5 0.5,41.636 0.5,27 Z M27,5.5 C15.126,5.5 5.5,15.126 5.5,27 C5.5,38.874 15.126,48.5 27,48.5 C38.874,48.5 48.5,38.874 48.5,27 C48.5,15.126 38.874,5.5 27,5.5 Z"
      />
    </svg>
    <h2>Players</h2>
    <li>
      {#if !$session}
        <p>No session selected</p>
      {:else if $players && Object.keys($players).length}
        <PlayerList players={$players} />
      {:else}
        <p>No players in this session</p>
      {/if}
    </li>
    <!-- TODO -->
    <li><button>Remove players</button></li>
  </Menu>
</div>

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

  .multimenu {
    position: absolute;
    top: env(titlebar-area-height);
    height: calc(100% - env(titlebar-area-height));
    left: 0;
    display: flex;
    flex-direction: column;
  }

  main {
    padding: 10px;
    margin-left: calc(1em + 4ch);
  }
</style>
