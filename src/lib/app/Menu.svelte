<script>
  import { tick } from 'svelte';
  import { ip, port } from '$lib/stores';
  import qrious from 'qrious';
  import PlayerList from '../PlayerList.svelte';
  import MenuWrapper from '../MenuWrapper.svelte';
  import Dropdown from '../Dropdown.svelte';

  export let session = {};
  export let players = {};

  let showMenu;
  let showQR = false;
  let qrContainer;

  $: showMenu && showQR && displayQR();

  async function displayQR() {
    await tick();
    const width = qrContainer?.offsetWidth;
    if (showQR) {
      new qrious({
        element: document.getElementById('qr'),
        value: `http://${$ip}:${port}/control`,
        size: width,
      });
    }
  }
</script>

<MenuWrapper bind:showMenu>
  {#if session}
    <h2>{session.name}</h2>
  {/if}
  <li bind:this={qrContainer}>
    <Dropdown title="Show QR code" on:click={displayQR} bind:open={showQR}>
      <canvas id="qr" />
    </Dropdown>
  </li>
  <!-- TODO -->
  <li><button>Switch session</button></li>
  <li>
    <Dropdown title="Show players">
      {#if !session}
        <p>No session selected</p>
      {:else if players && Object.keys(players).length}
        <PlayerList {players} />
      {:else}
        <p>No players in this session</p>
      {/if}
    </Dropdown>
  </li>
  <!-- TODO -->
  <li><button>Remove players</button></li>
</MenuWrapper>

<style>
  h2,
  p {
    margin: 0;
    padding: 1ch;
  }

  li button:hover {
    background: rgba(0, 0, 0, 0.173);
  }

  li button {
    width: 100%;
    text-align: left;
    padding: 1ch 3ch;
  }

  canvas {
    max-width: 100%;
  }
</style>
