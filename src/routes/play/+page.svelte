<script>
  import { onMount } from 'svelte';
  import Column from '$lib/Column.svelte';
  import Menu from '../../lib/Menu.svelte';

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
      } else if (msg.type === 'addplayer' && !session.players[msg.player.id]) {
        session.players[msg.player.id] = msg.player;
      } else if (msg.type === 'playeronline') {
        session.players[msg.id].online = true;
      } else if (msg.type === 'playeroffline') {
        session.players[msg.id].online = false;
      }
    });

    ipc.on('control', (e, msg) => {
      msg = JSON.parse(msg);
      console.log(msg);
      if (msg.direction) {
        if (!session.players[msg.id].position) {
          session.players[msg.id].position = {
            x: 0,
            y: 0,
          };
        }
        session.players[msg.id].position.x += msg.direction.x;
        session.players[msg.id].position.y += msg.direction.y;
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

<svelte:head>
  <title>Play D&amp;D{session ? ` - Session: ${session.name}` : ''}</title>
</svelte:head>

<Menu {session} />

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
  {#if session.players}
    {#each Object.entries(session.players) as player}
      <div
        class="player"
        style="transform: translate({session.players[player[0]].position
          ?.x}px, {session.players[player[0]].position?.y}px);"
      >
        <div class="tag">{player[0].slice(0, 16)}{player[0].length > 15 ? '...' : ''}</div>
        <div class="token" />
      </div>
    {/each}
  {/if}
{/if}

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
