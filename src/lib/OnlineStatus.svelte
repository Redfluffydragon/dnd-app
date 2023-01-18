<script>
  export let status;
</script>

<span class:online={status}></span>

<style>
  span {
    display: inline-block;
    width: 1em;
    border: 2px solid var(--primary-text);
    aspect-ratio: 1;
    border-radius: 999px;
    background: red;
  }

  .online {
    background: green;
  }
</style>
