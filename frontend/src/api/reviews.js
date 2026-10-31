import { client } from './client.js';

export const listReviews = (recipeId, params) => client.get(`/recipes/${recipeId}/reviews`, { params }).then((r) => r.data);
export const createReview = (recipeId, body) => client.post(`/recipes/${recipeId}/reviews`, body).then((r) => r.data);
export const deleteReview = (id) => client.delete(`/reviews/${id}`).then(() => undefined);
