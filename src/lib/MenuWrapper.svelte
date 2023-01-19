<script>
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  export let showMenu = false;
  export let inApp = true;

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
  class:outOfApp={!inApp}
  on:click={() => {
    showMenu = !showMenu;
  }}
  ><svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M7 32H57M7 50H57M7 14H57" stroke="currentColor" stroke-width="5" />
  </svg>
</button>
{#if showMenu}
  <menu transition:fly={{ x: -250 }} class:outOfApp={!inApp}>
    <button
      class="closeButton imgButton"
      on:click={() => {
        showMenu = false;
      }}
      ><svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <path d="M50 2L2 50M2 2L50 50" stroke="currentColor" stroke-width="5" />
      </svg>
    </button>
    <slot />
  </menu>
{/if}

<style>
  .menuButton,
  menu {
    position: fixed;
    left: 0;
    top: env(titlebar-area-height);
    margin: 0;
  }

  menu {
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
    z-index: 100;
  }

  .closeButton {
    align-self: flex-start;
  }

  :global(menu li button:hover) {
    background: rgba(0, 0, 0, 0.173);
  }

  :global(menu li button) {
    width: 100%;
    text-align: left;
    padding: 1ch 3ch;
  }

  .outOfApp {
    top: 0;
  }
</style>
