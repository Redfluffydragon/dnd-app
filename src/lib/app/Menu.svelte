<script>
  import { slide } from 'svelte/transition';
  import { tick } from 'svelte';
  import { ip, port } from '$lib/stores';
  import qrious from 'qrious';
  import PlayerList from '../PlayerList.svelte';
  import MenuWrapper from '../MenuWrapper.svelte';

  export let session = {};
  export let players = {};

  let showMenu;
  let showQR = false;
  let qrContainer;
  let showPlayers = false;

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
  <h2>{session.name}</h2>
  <li>
    <button
      bind:this={qrContainer}
      on:click={() => {
        showQR = !showQR;
        displayQR();
      }}>Show QR code</button
    >
    {#if showQR}
      <div transition:slide>
        <canvas id="qr" />
      </div>
    {/if}
  </li>
  <!-- TODO -->
  <li><button>Switch session</button></li>
  <li>
    <button
      on:click={() => {
        showPlayers = !showPlayers;
      }}>Show players</button
    >
    {#if showPlayers}
      {#if !session}
        <p>No session selected</p>
      {:else if players && Object.keys(players).length}
        <div transition:slide>
          <PlayerList {players} />
        </div>
      {:else}
        <p>No players in this session</p>
      {/if}
    {/if}
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
