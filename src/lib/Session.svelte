<script>
  import { players, session } from '$lib/stores';
  import Token from './Token.svelte';
</script>

{#if $players}
  {#each Object.keys($players) as playerID (playerID)}
    <Token {playerID} />
  {/each}
{/if}
