<div>
  <slot />
</div>

<style>
  div {
    display: grid;
    grid-template-columns: 1fr calc(100% - 44px) 1fr;
    place-items: center;
  }

  :global(div > *) {
    grid-column: 2;
  }
</style>
