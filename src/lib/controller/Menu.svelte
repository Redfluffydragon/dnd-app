<script>
  import { createEventDispatcher } from 'svelte';
  import Dropdown from '../Dropdown.svelte';
  import MenuWrapper from '../MenuWrapper.svelte';

  const dispatch = createEventDispatcher();
</script>

<MenuWrapper>
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
  <li><button>Change session name</button></li>
</MenuWrapper>

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
