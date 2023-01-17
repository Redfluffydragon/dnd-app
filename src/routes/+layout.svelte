<script>
  import '../app.scss';
  import { page } from '$app/stores';
  import { fly, slide } from 'svelte/transition';
  import { onMount, tick } from 'svelte';
  import { ip } from '$lib/stores';
  import qrious from 'qrious';

  let showMenu = false;
  let showQR = false;

  onMount(() => {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('menu,.menuButton')) {
        showMenu = false;
      }
    });

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
    {#if !$page.route.id.includes('control')}
      <a href="/">Home</a>
    {/if}
  </div>
  {#if $page.route.id.includes('play')}
    <button
      class="menuButton imgButton"
      on:click={() => {
        showMenu = !showMenu;
      }}
      ><svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <path
          d="M7 32H57M7 50H57M7 14H57"
          stroke="currentColor"
          stroke-width="5"
        />
      </svg>
    </button>
    {#if showMenu}
      <menu transition:fly={{ x: 200 }}>
        <button
          class="closeButton imgButton"
          on:click={() => {
            showMenu = false;
          }}
          ><svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path
              d="M50 2L2 50M2 2L50 50"
              stroke="currentColor"
              stroke-width="5"
            />
          </svg>
        </button>
        <li>
          <button
            on:click={async () => {
              showQR = !showQR;
              await tick();
              if (showQR) {
                new qrious({
                  element: document.getElementById('qr'),
                  value: `http://${$ip}:8000/control`,
                  size: window.innerWidth * 0.2,
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
        <li><button>Remove players</button></li>
      </menu>
    {/if}
  {/if}
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

  .menuButton {
    position: fixed;
    right: 0;
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
    min-width: 20%;
  }

  .closeButton {
    align-self: flex-end;
  }

  menu li button:hover {
    filter: brightness(0.8);
  }

  menu li button {
    width: 100%;
    text-align: left;
  }
</style>
