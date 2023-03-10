<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Joystick from '$lib/Joystick.svelte';
  import Column from '$lib/Column.svelte';
  import Menu from '$lib/Menu.svelte';
  import Dropdown from '$lib/Dropdown.svelte';

  // TODO something for anti-sleep (play a small video?)
  // should be optional - per device or per player?

  let id = '';
  let globalName = '';
  let sessionName = '';
  let socket;
  let error = '';
  let waitingMsg = 'Trying to connect...';
  let showMenu;
  let pinned;

  onMount(() => {
    id = localStorage.getItem('dnd-id') || '';
    globalName = localStorage.getItem('dnd-name') || '';

    socket = new WebSocket(`ws://${location.hostname}/control`);

    // Connection opened
    socket.addEventListener('open', (event) => {
      waitingMsg = 'Connected, waiting for server...';
      socket.send(message('controllerconnected'));
    });

    let messages = '';
    // Listen for websocket messages
    socket.addEventListener('message', (event) => {
      console.log('Message from server:', event.data);
      messages += event.data + '\n';
      document.getElementById('messages').textContent = messages;
      const e = JSON.parse(event.data);

      error = '';
      if (e.ok) {
        if (e.type === 'controllerconnected') {
          id && socket.send(message('connectplayer', { newPlayer: false }));
        } else if (e.type === 'sessionstart') {
          waitingMsg = null;
          sessionName = e.sessionName;
        } else if (e.type === 'playeradded') {
          waitingMsg = null;
          id = e.id;
          globalName = e.name;
          sessionName = e.sessionName;
          localStorage.setItem('dnd-id', e.id);
          localStorage.setItem('dnd-name', e.name);
        } else if (e.type === 'changeglobalname') {
          globalName = e.name;
          localStorage.setItem('dnd-name', globalName);
          !pinned && (showMenu = false);
        } else if (e.type === 'changesessionname') {
          sessionName = e.name;
        }
      } else if (e.status === 503) {
        waitingMsg = 'Connected, waiting for session to start...';
        error = '';
      } else {
        error = e.msg;
      }
    });

    socket.addEventListener('close', (event) => {
      waitingMsg = 'Connection lost. Try reloading.';
    });

    socket.addEventListener('error', (event) => {
      console.log(event);
      waitingMsg = 'Connection lost. Try reloading.';
    });

    // Controller clicks
    document.addEventListener(
      'click',
      (e) => {
        if (e.target.matches('button') && e.target.closest('#controlForm')) {
          socket.send(
            message('control', {
              direction: {
                x: e.target.value.match(/(left|right)/)
                  ? 10 * (e.target.value.match('left') ? -1 : 1)
                  : 0,
                y: e.target.value.match(/(up|down)/)
                  ? 10 * (e.target.value.match('up') ? -1 : 1)
                  : 0,
              },
            })
          );
        }
      },
      false
    );
  });

  function message(type, body = {}, msgID = id) {
    return JSON.stringify({
      ...body,
      type,
      id: msgID,
    });
  }
</script>

<svelte:head>
  <title>D&D Controller</title>
  <meta name="theme-color" content="#da3e3e" />
</svelte:head>

<Menu bind:showMenu bind:pinned>
  <li>
    <Dropdown title="Change global name">
      <form
        on:submit={(e) => {
          const name = new FormData(e.target).get('name');
          if (!name) return;
          e.preventDefault();
          socket.send(
            message('changeglobalname', {
              name,
            })
          );
        }}
      >
        <label
          >New name:<input
            on:focus={(e) => {
              e.target.select();
            }}
            type="text"
            name="name"
            required
            value={globalName}
          /></label
        >
        <button>Change</button>
      </form>
    </Dropdown>
  </li>
  <li>
    <Dropdown title="Change session name">
      <form
        on:submit={(e) => {
          const name = new FormData(e.target).get('name');
          if (!name) return;
          e.preventDefault();
          socket.send(
            message('changesessionname', {
              name,
            })
          );
        }}
      >
        <label
          >New name:<input
            on:focus={(e) => {
              e.target.select();
            }}
            type="text"
            name="name"
            value={sessionName}
            required
          /></label
        >
        <button>Change</button>
      </form>
    </Dropdown>
  </li>
  <li><button>Edit avatar</button></li>
</Menu>

<span class="name">Name: {sessionName || globalName || ''} {id}</span>

{#if waitingMsg}
  <h1>{waitingMsg}</h1>
  {#if waitingMsg.includes('reload')}
    <Column>
      <button
        on:click={() => {
          location.reload();
        }}>Reload</button
      >
    </Column>
  {/if}
{/if}
{#if !id || error}
  <h1>Add a new controller</h1>
  <form
    on:submit={(e) => {
      if (!browser) return;

      const data = new FormData(e.target);
      const newName = data.get('id');
      if (!newName) return;
      e.preventDefault();

      socket.send(
        message('connectplayer', { newPlayer: data.get('new'), name: newName })
      );
    }}
  >
    <label>
      Please enter a player ID: <input type="text" name="id" required />
    </label>
    <label>
      Add as new player: <input type="checkbox" name="new" checked />
    </label>
    <br />
    <button>Join</button>
    <p class="error">{error}</p>
  </form>
{:else if !waitingMsg}
  <h1>Player: {sessionName || globalName}</h1>
  <Column>
    <Joystick
      on:input={(e) => {
        socket.send(
          message('control', {
            direction: {
              x: e.detail.x * 10,
              y: e.detail.y * 10,
            },
          })
        );
      }}
    />
  </Column>
{/if}

<pre id="messages" />

<style>
  form {
    margin: 2ch;
    place-items: center;
    gap: 2ch;
  }

  .error {
    color: red;
  }

  li {
    padding: 0;
  }

  form button {
    text-align: center;
    background: var(--secondary);
    margin: 0;
  }

  label {
    text-align: center;
  }

  input {
    width: 100%;
  }
</style>
