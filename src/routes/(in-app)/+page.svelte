<script>
  import { onMount } from 'svelte';
  import Column from '$lib/Column.svelte';
  import PlayerList from '$lib/PlayerList.svelte';
  import { ip, port, players, session } from '$lib/stores';
  import Session from '$lib/Session.svelte';
  import qrious from 'qrious';

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
      } else if (msg.type === 'updateplayer') {
        $players[msg.id] = msg.player;
      } else if (msg.type === 'playeroffline') {
        $players[msg.id] && ($players[msg.id].online = false);
      }
    });

    ipc.on('control', (e, msg) => {
      if (!$session) return;
      msg = JSON.parse(msg);

      if (msg.position) {
        $players[msg.id][$session.id].position = msg.position;
      }
    });

    ip.subscribe(() => {
      new qrious({
        element: document.getElementById('controllerQR'),
        value: `http://${$ip}${$port}`,
        size: Math.min(window.innerWidth, window.innerHeight) * 0.33,
      });
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
    ipc.send(
      'session',
      JSON.stringify({
        type: 'deletesession',
        id,
      })
    );
  }
</script>

<svelte:head>
  <title>Play D&amp;D{$session ? ` - Session: ${$session.name}` : ''}</title>
</svelte:head>

{#if !$session}
  <h1>Select or create a session</h1>
  <Column>
    <div class="columns">
      <div>
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
              <button
                type="button"
                class="dangerButton"
                on:click={deleteSession}>Delete</button
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
          <label>Session name: <input type="text" name="name" required /></label
          >
          <button>Create</button>
        </form>
      </div>
      <div class="center">
        <h2>Add controllers</h2>
        <p>
          <!-- TODO add an easier way to share the url (besides the QR code) - maybe a copy button or a share button? -->
          To add a player/controller, go to {$ip ? `${$ip}${$port}` : 'control'}
          {#if $ip}
            <br /> or scan the QR code below
          {/if}
        </p>
        <canvas id="controllerQR" />
        {#if Object.keys($players).length}
          <br />
          <h2>Players online:</h2>
          <PlayerList players={$players} filter={(player) => player.online} />
        {/if}
      </div>
    </div>
  </Column>
{:else}
  <Session />
{/if}

<style>
  .columns {
    display: flex;
    flex-wrap: wrap;
    column-gap: 10vw;
    justify-content: center;
  }

  h2 {
    margin-bottom: 0;
  }

  .center {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
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
