<script>
  export let online;
</script>

<span class:online></span>

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
