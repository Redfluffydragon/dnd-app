<script>
  import { onMount } from 'svelte';
  import Column from '../../lib/Column.svelte';

  /** @type {import('./$types').PageData} */
  // export let data;
  let sessions = [];
  let session = null;
  let waitingMsg = 'Loading sessions...';

  onMount(() => {
    ipc.send(
      'session',
      JSON.stringify({
        type: 'readystate',
        readyState: 'ready',
      })
    );

    ipc.on('session', (e, msg) => {
      msg = JSON.parse(msg);
      if (msg.type === 'listsessions' && msg.sessions) {
        sessions = msg.sessions;
        waitingMsg = 'No saved sessions found';
      } else if (msg.type === 'session') {
        // TODO save session in sessionStorage
        session = msg.session;
      }
    });

    ipc.on('players', (e, msg) => {
      msg = JSON.parse(msg);
      if (msg.type === 'allplayers') {
        session.players = msg.players;
      }
    });
  });

  function newSession(name) {
    ipc.send(
      'session',
      JSON.stringify({
        type: 'newsession',
        name,
      })
    );
  }

  function selectSession(id) {
    ipc.send(
      'session',
      JSON.stringify({
        type: 'session',
        id,
      })
    );
  }
</script>

{#if !session}
  <h1>Select or create a session</h1>
  <Column>
    {#if sessions.length}
      <h2>Select a session</h2>
      <form
        on:submit={(e) => {
          e.preventDefault();
          const id = new FormData(e.target).get('id');
          selectSession(id);
        }}
      >
        <select name="id">
          {#each sessions as sessionOption}
            <option value={sessionOption.id}>{sessionOption.name}</option>
          {/each}
        </select>
        <button>Select</button>
      </form>
    {:else}
      <h2>{waitingMsg}</h2>
    {/if}

    <form
      on:submit={(e) => {
        const name = new FormData(e.target).get('name');
        if (!name) return;
        e.preventDefault();
        newSession(name);
      }}
    >
      <h2>Create a new session</h2>
      <label>Session name: <input type="text" name="name" required /></label>
      <button>Create</button>
    </form>
  </Column>
{:else}
  <h1>Session: {session.name}</h1>
  {#if console.log(session.players) || session.players}
    {#each Object.entries(session.players) as player}
      <p>{player[0]}</p>
    {/each}
  {/if}
{/if}
