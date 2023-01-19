<script>
  import { players } from '$lib/stores';
  import OnlineStatus from './OnlineStatus.svelte';
  export let playerID;

  $: player = $players[playerID];
</script>

<div
  class="player"
  style="transform: translate({player.position?.x}px, {player.position?.y}px);"
>
  <div class="tag">
    {#if !player.online}
      <OnlineStatus online={false} />
    {/if}
    {player.name.slice(0, 16)}{player.name.length > 15 ? '...' : ''}
  </div>
  <div class="token" />
</div>

<style>
  .player {
    display: flex;
    flex-direction: column;
    place-items: center;
    will-change: transform;
  }

  .tag {
    display: flex;
    align-items: center;
    gap: 0.5ch;
  }

  .token {
    background: var(--primary);
    width: 4em;
    aspect-ratio: 1;
    border-radius: 50%;
    transition: transform 20ms;
  }
</style>
