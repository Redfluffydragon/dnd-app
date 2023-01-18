<script>
  import { fly, slide } from 'svelte/transition';
  import { onMount, tick } from 'svelte';
  import { ip, port } from '$lib/stores';
  import qrious from 'qrious';
  import PlayerList from './PlayerList.svelte';

  export let session = {};
  export let players = {};

  let menu;
  let showMenu = false;
  let showQR = false;
  let showPlayers = false;

  onMount(() => {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('menu,.menuButton')) {
        showMenu = false;
      }
    });
  });
</script>

<button
  class="menuButton imgButton"
  on:click={() => {
    showMenu = !showMenu;
  }}
  ><svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M7 32H57M7 50H57M7 14H57" stroke="currentColor" stroke-width="5" />
  </svg>
</button>
{#if showMenu}
  <menu transition:fly={{ x: 200 }} bind:this={menu}>
    <button
      class="closeButton imgButton"
      on:click={() => {
        showMenu = false;
      }}
      ><svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <path d="M50 2L2 50M2 2L50 50" stroke="currentColor" stroke-width="5" />
      </svg>
    </button>
    <li>
      <button
        on:click={async () => {
          showQR = !showQR;
          const width = menu.offsetWidth;
          await tick();
          if (showQR) {
            new qrious({
              element: document.getElementById('qr'),
              value: `http://${$ip}:${port}/control`,
              size: width,
            });
          }
        }}>Show QR code</button
      >
      {#if showQR}
        <div transition:slide>
          <canvas id="qr" />
        </div>
      {/if}
    </li>
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
            <PlayerList players={players} />
          </div>
        {:else}
          <p>No players in this session</p>
        {/if}
      {/if}
    </li>
    <li><button>Remove players</button></li>
  </menu>
{/if}

<style>
  .menuButton {
    position: fixed;
    right: 0;
    top: 0;
  }

  menu {
    list-style: none;
    display: flex;
    flex-direction: column;
    background: var(--primary);
    position: fixed;
    right: 0;
    top: 0;
    box-shadow: -5px 5px 15px rgba(0, 0, 0, 0.334);
    height: 100%;
    padding: 0;
    margin: 0;
    max-width: 30ch;
    width: 30ch;
    color: var(--primary-text);
  }

  .closeButton {
    align-self: flex-end;
  }

  menu li button:hover {
    background: rgba(0, 0, 0, 0.173);
  }

  menu li button {
    width: 100%;
    text-align: left;
  }

  canvas {
    max-width: 100%;
  }
</style>
