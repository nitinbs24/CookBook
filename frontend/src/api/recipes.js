import { client } from './client.js';

// axios drops undefined params, so { foodType: undefined } means "Both" (TRD §6.1).
export const listRecipes = (params) => client.get('/recipes', { params }).then((r) => r.data);
export const trending = (params) => client.get('/recipes/trending', { params }).then((r) => r.data);
export const categories = (params) => client.get('/categories', { params }).then((r) => r.data);
export const getRecipe = (id) => client.get(`/recipes/${id}`).then((r) => r.data);
export const deleteRecipe = (id) => client.delete(`/recipes/${id}`).then(() => undefined);
export const createRecipe = (body) => client.post('/recipes', body).then((r) => r.data);
export const updateRecipe = (id, body) => client.put(`/recipes/${id}`, body).then((r) => r.data);
export const myRecipes = (params) => client.get('/me/recipes', { params }).then((r) => r.data);

/** Uploads one image (multipart field "image") and returns { url, publicId } (TRD §10). */
export function uploadImage(file) {
  const form = new FormData();
  form.append('image', file);
  return client.post('/uploads', form).then((r) => r.data);
}
