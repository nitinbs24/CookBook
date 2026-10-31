import { client } from './client.js';

// axios drops undefined params, so { foodType: undefined } means "Both" (TRD §6.1).
export const listRecipes = (params) => client.get('/recipes', { params }).then((r) => r.data);
export const trending = (params) => client.get('/recipes/trending', { params }).then((r) => r.data);
export const categories = (params) => client.get('/categories', { params }).then((r) => r.data);
export const getRecipe = (id) => client.get(`/recipes/${id}`).then((r) => r.data);
export const deleteRecipe = (id) => client.delete(`/recipes/${id}`).then(() => undefined);
