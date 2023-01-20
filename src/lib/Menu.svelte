<script>
  import { fly } from 'svelte/transition';
  import { onDestroy, onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let showMenu = false;
  export let pinned = false;

  function hideMenu(e) {
    if (!pinned && !e.target.closest('menu,.menuButton')) {
      showMenu = false;
    }
  }

  onMount(() => {
    document.addEventListener('click', hideMenu);
  });

  onDestroy(() => {
    if (!browser) return;
    document.removeEventListener('click', hideMenu);
  });
</script>

<button
  class="menuButton imgButton"
  on:click={() => {
    showMenu = !showMenu;
  }}
  ><slot name="icon">
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path
        d="M7 32H57M7 50H57M7 14H57"
        stroke="currentColor"
        stroke-width="5"
      />
    </svg>
  </slot>
</button>
{#if showMenu}
  <menu transition:fly={{ x: -250 }}>
    <div class="buttons">
      <button
        class="closeButton imgButton"
        on:click={() => {
          showMenu = false;
          pinned = false;
        }}
        ><svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <path
            d="M50 2L2 50M2 2L50 50"
            stroke="currentColor"
            stroke-width="5"
          />
        </svg>
      </button>
      <button
        class="imgButton"
        on:click={() => {
          pinned = !pinned;
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill={pinned ? 'currentColor' : 'none'}
        >
          <path
            d="M27.1987 35.3883L15.2621 25.0957C19.4731 21.5913 24.1422 22.8425 25.9504 23.9061L42.0504 9.54448C42.2505 7.9332 42.492 4.72238 43.2272 3.86977L58.5742 17.1031C57.839 17.9557 54.6986 18.6669 53.1343 19.1019L41.2974 37.1394C42.6154 38.7715 44.5398 43.2057 41.693 47.8864L29.7565 37.5938M27.1987 35.3883L13.5978 51.1616L10.8332 56.9537L16.1556 53.3671L29.7565 37.5938M27.1987 35.3883L29.7565 37.5938"
            stroke="currentColor"
            stroke-width="5"
          />
        </svg>
      </button>
    </div>
    <slot />
  </menu>
{/if}

<style>
  .menuButton,
  menu {
    top: 0;
    left: 0;
    margin: 0;
  }

  .menuButton {
    position: relative;
    z-index: 100;
  }

  menu {
    position: absolute;
    list-style: none;
    display: flex;
    flex-direction: column;
    background: var(--primary);

    box-shadow: 5px 0 15px rgba(0, 0, 0, 0.334);
    height: 100%;
    padding: 0;
    max-width: 30ch;
    width: 30ch;
    color: var(--primary-text);
    z-index: 101;
  }

  .closeButton {
    align-self: flex-start;
  }

  :global(menu h2, menu p) {
    margin: 0;
    padding: 0 1ch;
  }

  :global(menu li button:hover) {
    background: rgba(0, 0, 0, 0.173);
  }

  :global(menu li button) {
    width: 100%;
    text-align: left;
    padding: 1ch 3ch;
  }
</style>
