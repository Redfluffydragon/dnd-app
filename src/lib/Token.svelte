<script>
  import { players } from '$lib/stores';
  export let playerID;

  $: player = $players[playerID];
</script>

<div
  class="player"
  style="transform: translate({player.position?.x}px, {player.position?.y}px);"
>
  <div class="tag">
    {player.name.slice(0, 16)}{player.name.length > 15 ? '...' : ''}
  </div>
  <div class="token" />
</div>

<style>
  .player {
    position: absolute;
    display: flex;
    flex-direction: column;
    place-items: center;
    will-change: transform;
  }

  .tag {
    text-align: center;
  }

  .token {
    background: var(--primary);
    width: 4em;
    aspect-ratio: 1;
    border-radius: 50%;
    transition: transform 20ms;
  }
</style>
