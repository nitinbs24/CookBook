import { client } from './client.js';

export const like = (recipeId) => client.post(`/recipes/${recipeId}/like`).then((r) => r.data);
export const unlike = (recipeId) => client.delete(`/recipes/${recipeId}/like`).then((r) => r.data);
