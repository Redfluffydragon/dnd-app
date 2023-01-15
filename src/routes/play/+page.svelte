<script>
  import { onMount } from "svelte";

  /** @type {import('./$types').PageData} */
  // export let data;

  onMount(() => {
    let left = 0;

    // Listen for messages
    ipc.on('control', (e, msg) => {
      console.log(msg);
      const lr = msg.match(/(left|right)/)?.[0];
      if (lr) {
        if (lr === "left") {
          left -= 10;
        } else {
          left += 10;
        }
        document.getElementById("testToken").style.left = left + "px";
      }
    })

    document.getElementById('test-msg').addEventListener('click', () => {
      ipc.send('main', 'Test message');
    })
  });
</script>

<h1>Play</h1>
<div id="testToken" />
<br><br>
<button id="test-msg">Send test message</button>

<style>
  #testToken {
    width: 1em;
    aspect-ratio: 1;
    background: red;
    position: absolute;
  }
</style>
