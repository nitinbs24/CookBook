import { client } from './client.js';

export const adminRecipes = (params) => client.get('/admin/recipes', { params }).then((r) => r.data);
export const adminUsers = (params) => client.get('/admin/users', { params }).then((r) => r.data);
export const userRecipes = (id, params) => client.get(`/admin/users/${id}/recipes`, { params }).then((r) => r.data);
