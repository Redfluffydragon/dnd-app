import { writable } from "svelte/store";

export const ip = writable(null);

export const port = 3000;

export const session = writable(null);
export const players = writable({});
