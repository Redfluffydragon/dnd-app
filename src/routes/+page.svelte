<script>
  import { onMount } from "svelte";
  import QRrious from "qrious";

  onMount(() => {
    // notify main that the page is loaded
    ipc.send('ip', 'ready');

    // display qr code
    ipc.on("ip", (e, msg) => {
      new QRrious({
        element: document.getElementById("controllerQR"),
        value: `http://${msg}:8000/control`,
      });
    });
  });
</script>

<svelte:head>
  <title>D&D App</title>
</svelte:head>

<main>
  <h1>D&D App</h1>
  <p>To start a new session, go to <a href="/play">Play</a></p>
  <p>To add a controller, go to <a href="/control">Control</a></p>
  <canvas id="controllerQR" />
</main>

<style lang="scss">
  main {
    text-align: center;
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    text-transform: uppercase;
    font-size: 4rem;
    font-weight: 100;
    line-height: 1.1;
    margin: 4rem auto;
    max-width: 14rem;
  }

  p {
    max-width: 14rem;
    margin: 2rem auto;
    line-height: 1.35;
  }

  #controllerQR {
    height: 6em;
  }

  @media (min-width: 480px) {
    h1 {
      max-width: none;
    }

    p {
      max-width: none;
    }
  }
</style>
