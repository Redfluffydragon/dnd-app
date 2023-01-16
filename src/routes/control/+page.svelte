<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Joystick from '../../lib/Joystick.svelte';
  import Column from '../../lib/Column.svelte';

  /** @type {import('./$types').PageData} */
  // export let data;

  let id = '';
  let socket;
  let error = '';
  let waitingMsg = 'Trying to connect...';

  onMount(() => {
    id = localStorage.getItem('dnd-id') || '';
    console.log(id);

    socket = new WebSocket(`ws://${location.host}/control`);

    // Connection opened
    socket.addEventListener('open', (event) => {
      waitingMsg = 'Connected, waiting for session to start';
      socket.send(message('controllerconnected'));
    });

    let messages = '';
    // Listen for websocket messages
    socket.addEventListener('message', (event) => {
      console.log('Message from server:', event.data);
      messages += event.data + '\n';
      document.getElementById('messages').textContent = messages;
      const e = JSON.parse(event.data);

      if (e.ok) {
        if (e.type === 'sessionstart') {
          waitingMsg = null;

          if (id) {
            socket.send(message('connectplayer', { newPlayer: false }));
          }
        } else if (e.type === 'playeradded') {
          id = e.id;
          localStorage.setItem('dnd-id', e.id);
        }
      } else if (e.status === 503) {
        // session not started yet, do nothing
      } else {
        error = e.msg;
      }
    });

    socket.addEventListener('close', (event) => {
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

{#if waitingMsg}
  <h1>{waitingMsg}</h1>
{:else if !id}
  <h1>Add a new controller</h1>
  <form
    on:submit={(e) => {
      if (!browser) return;

      const data = new FormData(e.target);
      const newID = data.get('id');
      if (!newID) return;
      e.preventDefault();

      socket.send(
        message('connectplayer', { newPlayer: data.get('new') }, newID)
      );
    }}
  >
    <label
      >Please enter a player ID: <input type="text" name="id" required /></label
    >
    <label
      >Add as new player: <input type="checkbox" name="new" checked /></label
    >
    <br />
    <button>Join</button>
    <p class="error">{error}</p>
  </form>
{:else}
  <h1>Player: {id}</h1>
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
    display: flex;
    flex-direction: column;
    place-items: center;
    gap: 2ch;
  }

  .error {
    color: red;
  }
</style>
