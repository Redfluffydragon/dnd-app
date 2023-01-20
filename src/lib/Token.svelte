<script>
  import { players, session } from '$lib/stores';
  import OnlineStatus from './OnlineStatus.svelte';
  export let playerID;

  $: player = $players[playerID];
  $: name = player?.[$session.id]?.name || player?.name || '';
</script>

<div
  class="player"
  style="transform: translate({player?.[$session.id]?.position?.x}px, {player?.[
    $session.id
  ]?.position?.y}px);"
>
  <div class="tag">
    {#if !player.online}
      <OnlineStatus online={false} />
    {/if}
    {name.slice(0, 16)}{name.length > 15 ? '...' : ''}
  </div>
  <div class="token" />
</div>

<style>
  .player {
    display: flex;
    flex-direction: column;
    place-items: center;
    will-change: transform;
    width: max-content;
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
