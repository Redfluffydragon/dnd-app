<script>
  import '../app.scss';
</script>

<header>
  <a href="/">Home</a>
</header>

<main>
  <slot />
</main>

<style>
  header {
    padding: 1ch;
  }

  main {
    padding: 10px;
  }
</style>
