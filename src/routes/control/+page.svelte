<script>
  import { onMount } from "svelte";

  /** @type {import('./$types').PageData} */
  // export let data;

  onMount(() => {
    const socket = new WebSocket(`ws://${location.host}/control`);

    // Connection opened
    socket.addEventListener("open", (event) => {
      socket.send("Controller connected");
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      console.log("Message from server:", event.data);
    });

    document.addEventListener(
      "click",
      (e) => {
        if (e.target.matches("button")) {
          console.log(e.target.value);
          socket.send(e.target.value);
        }
      },
      false
    );

    /* document.forms.controlForm.addEventListener(
      "input",
      (e) => {
        console.log(data);
        socket.send("form input");
      },
      false
    ); */

    document.forms.controlForm.addEventListener("submit", (e) => {
      e.preventDefault();
    });
  });
</script>

<h1>Control</h1>
<form id="controlForm">
  <button type="button" value="up">/\</button>
  <button type="button" value="left">left</button>
  <button type="button" value="right">right</button>
  <button type="button" value="down">\/</button>
</form>
