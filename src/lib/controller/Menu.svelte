<script>
  import { createEventDispatcher } from 'svelte';
  import Dropdown from '../Dropdown.svelte';
  import Menu from '../Menu.svelte';

  const dispatch = createEventDispatcher();
</script>

<Menu>
  <li>
    <Dropdown title="Change global name">
      <form
        on:submit={(e) => {
          const name = new FormData(e.target).get('name');
          if (!name) return;
          e.preventDefault();
          dispatch('submit', {
            type: 'changeglobalname',
            name,
          });
        }}
      >
        <label>New name:<input type="text" name="name" required /></label>
        <button>Submit</button>
      </form>
    </Dropdown>
  </li>
  <li>
    <Dropdown title="Change session name">
      <form
        on:submit={(e) => {
          const name = new FormData(e.target).get('name');
          if (!name) return;
          e.preventDefault();
          dispatch('submit', {
            type: 'changesessionname',
            name,
          });
        }}
      >
        <label>New name:<input type="text" name="name" required /></label>
        <button>Submit</button>
      </form>
    </Dropdown>
  </li>
</Menu>

<style>
  form {
    padding: 2ch;
  }

  form button {
    text-align: center;
    background: var(--secondary);
  }

  label {
    text-align: center;
  }

  input {
    width: 100%;
  }
</style>
