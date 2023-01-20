<script>
  import { onMount } from 'svelte';
  import Column from '$lib/Column.svelte';
  import PlayerList from '$lib/PlayerList.svelte';
  import { players, session } from '$lib/stores';
  import Session from '$lib/Session.svelte';

  let sessions = []; // list of session names and IDs
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
        // set waiting message here, after checking for sessions; if there are no sessions, it will display
        waitingMsg = 'No saved sessions found';
      } else if (msg.type === 'session') {
        $session = msg.session;
      }
    });

    ipc.on('players', (e, msg) => {
      msg = JSON.parse(msg);
      if (msg.type === 'allplayers') {
        // keep local data first (maybe not the best approach)
        $players = { ...msg.players, ...$players };
      } else if (msg.type === 'addplayer') {
        // TODO consolidate addplayer and updateplayer
        console.log('add player:', msg);
        $players[msg.id] = msg.player;
      } else if (msg.type === 'playeronline') {
        $players[msg.id].online = true;
      } else if (msg.type === 'playeroffline') {
        $players[msg.id] && ($players[msg.id].online = false);
      } else if (msg.type === 'updateplayer') {
        $players[msg.id] = msg.player;
      }
    });

    ipc.on('control', (e, msg) => {
      if (!$session) return;
      msg = JSON.parse(msg);

      if (msg.position) {
        $players[msg.id][$session.id].position = msg.position;
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

  function deleteSession(e) {
    // tell main the user clicked delete so main can show a dialog
    const id = new FormData(e.target.closest('form')).get('id');
    ipc.send('session', JSON.stringify({
      type: 'deletesession',
      id,
    }));
  }
</script>

<svelte:head>
  <title>Play D&amp;D{$session ? ` - Session: ${$session.name}` : ''}</title>
</svelte:head>

{#if !$session}
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
        <div class="buttons">
          <!-- TODO -->
          <button type="button" class="dangerButton" on:click={deleteSession}
            >Delete</button
          >
          <button class="goButton">Select</button>
        </div>
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
    {#if Object.keys($players).length}
      <br />
      <h2>Players online:</h2>
      <PlayerList players={$players} filter={(player) => player.online} />
    {/if}
  </Column>
{:else}
  <Session />
{/if}

<style>
  h2 {
    margin-bottom: 0;
  }

  form {
    min-width: min(40ch, 100%);
  }

  input {
    width: 100%;
  }

  .buttons {
    text-align: center;
  }
</style>
