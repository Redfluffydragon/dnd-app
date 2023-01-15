<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  /** @type {import('./$types').PageData} */
  // export let data;

  let id = '';
  let socket;
  let error = '';

  onMount(() => {
    id = localStorage.getItem('dnd-id') || '';
    console.log(id);

    socket = new WebSocket(`ws://${location.host}/control`);

    // Connection opened
    socket.addEventListener('open', (event) => {
      socket.send(
        JSON.stringify({
          controllerID: id,
          newPlayer: false,
        })
      );
    });

    let messages = '';
    // Listen for websocket messages
    socket.addEventListener('message', (event) => {
      console.log('Message from server:', event.data);
      messages += event.data + '\n';
      document.getElementById('messages').textContent = messages;
      const e = JSON.parse(event.data);

      if (e.ok) {
        if (e.type === 'playeradded') {
          id = e.id;
          localStorage.setItem('dnd-id', e.id);
        }
      }
      else {
        error = e.msg;
      }
    });

    // Controller clicks
    document.addEventListener(
      'click',
      (e) => {
        if (e.target.matches('button') && e.target.closest('#controlForm')) {
          console.log(e.target.value);
          socket.send(
            JSON.stringify({
              button: e.target.value,
            })
          );
        }
      },
      false
    );
  });
</script>

{#if !id}
  <h1>Add a new controller</h1>
  <form
    on:submit={(e) => {
      if (!browser) return;

      const data = new FormData(e.target)
      const newID = data.get('id');
      if (!newID) return;
      e.preventDefault();

      socket.send(
        JSON.stringify({
          controllerID: newID,
          newPlayer: data.get('new'),
        })
      );
    }}
  >
    <label
      >Please enter a player ID: <input type="text" name="id" required /></label
    >
    <label>Add as new player: <input type="checkbox" name="new" checked></label>
    <br />
    <button>Join</button>
    <p class="error">{error}</p>
  </form>
{:else}
  <form id="controlForm">
    <button type="button" value="up">/\</button>
    <div>
      <button type="button" value="left">left</button>
      <button type="button" value="right">right</button>
    </div>
    <button type="button" value="down">\/</button>
  </form>
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
