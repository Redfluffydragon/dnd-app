<script>
  import { onMount } from "svelte";

  /** @type {import('./$types').PageData} */
  // export let data;

  onMount(() => {
    const socket = new WebSocket(`ws://${location.host}/play`);

    // Connection opened
    socket.addEventListener("open", (event) => {
      socket.send("Hello Server!");
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      console.log("Message from server:", event.data);
      const lr = event.data.match(/(left|right)/)?.[0];
      if (lr) {
        if (lr === "left") {
          left -= 10;
        } else {
          left += 10;
        }
        document.getElementById("testToken").style.left = left + "px";
      }
    });

    let left = 0;
  });
</script>

<h1>Play</h1>
<div id="testToken" />

<style>
  #testToken {
    width: 1em;
    aspect-ratio: 1;
    background: red;
    position: absolute;
  }
</style>
