<script>
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';

  export let title;
  export let open = false;

  const dispatch = createEventDispatcher();
</script>

<button
  aria-expanded={open}
  on:click={(e) => {
    open = !open;
    dispatch('click', e);
  }}>{title}</button
>
{#if open}
  <div transition:slide>
    <slot />
  </div>
{/if}

<style>
  button {
    padding-left: 3ch;
    position: relative;
  }

  button[aria-expanded='true'] {
    background: rgba(0, 0, 0, 0.112);
  }

  button::before {
    content: '';
    width: 0;
    height: 0;
    position: absolute;
    left: 1.3ch;
    top: 50%;
    border-top: 0.7ch solid transparent;
    border-bottom: 0.7ch solid transparent;
    border-left: 0.7ch solid;

    transform: translateY(-50%);
    transition: transform 0.3s;
  }

  button[aria-expanded='true']::before {
    transform: translateY(-50%) rotate(90deg);
  }
</style>
