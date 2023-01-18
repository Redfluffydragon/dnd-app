<script>
  import OnlineStatus from './OnlineStatus.svelte';

  export let players;
</script>

{#if players}
  <ul>
    {#each Object.keys(players) as id (id)}
      <li>
        <OnlineStatus online={players[id].online} />
        {players[id].name}
      </li>
    {/each}
  </ul>
{/if}

<style>
  li {
    display: grid;
    grid-template-columns: 1em 1fr;
    align-items: center;
    gap: 1ch;
  }
</style>
