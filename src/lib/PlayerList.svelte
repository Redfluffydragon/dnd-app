<script>
  import OnlineStatus from './OnlineStatus.svelte';

  export let players;
  export let filter = () => true;
</script>

{#if players}
  <ul>
    {#each Object.keys(players) as id (id)}
      {#if filter(players[id])}
        <li>
          <OnlineStatus online={players[id].online} />
          {players[id].name}
        </li>
      {/if}
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
