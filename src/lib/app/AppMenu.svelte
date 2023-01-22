<script>
  import { tick } from 'svelte';
  import { ip, port } from '$lib/stores';
  import qrious from 'qrious';
  import Menu from '$lib/Menu.svelte';
  import Dropdown from '$lib/Dropdown.svelte';
  import { session } from '$lib/stores';

  let showMenu;
  let pinned;
  let showQR = false;
  let qrContainer;

  $: showMenu && showQR && displayQR();
  function save() {
    ipc.send('save');
  }
  async function displayQR() {
    await tick();
    const width = qrContainer?.offsetWidth;
    if (showQR) {
      new qrious({
        element: document.getElementById('qr'),
        value: `http://${$ip}${$port}`,
        size: width,
      });
    }
  }

  function switchSession() {
    if (!$session) return;

    ipc.send(
      'session',
      JSON.stringify({
        type: 'switchsession',
      })
    );
    // re-get list of sessions because it goes away if you reload?
    ipc.send(
      'session',
      JSON.stringify({
        type: 'readystate',
        readyState: 'ready',
      })
    );
    $session = null;
    !pinned && (showMenu = false);
  }
</script>

<Menu bind:showMenu bind:pinned>
  {#if $session}
    <h2>{$session.name}</h2>
  {/if}
  <li bind:this={qrContainer}>
    <Dropdown title="Show QR code" on:click={displayQR} bind:open={showQR}>
      <canvas id="qr" />
    </Dropdown>
  </li>
  <li><button on:click={switchSession} disabled={!$session}>Switch sessions</button></li>
  <!-- TODO save confirmation of some sort -->
  <li><button on:click={save}>Save</button></li>
</Menu>

<style>
  li button {
    width: 100%;
    text-align: left;
    padding: 1ch 3ch;
  }

  canvas {
    max-width: 100%;
    aspect-ratio: 1;
  }
</style>
