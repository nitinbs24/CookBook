import * as reviewService from '../services/review.js';
import { pageQuery, reviewSchema } from '../validators/index.js';

export async function list(req, res) {
  res.json(await reviewService.listReviews(req.params.id, pageQuery.parse(req.query)));
}

export async function create(req, res) {
  res.status(201).json(await reviewService.createReview(req.params.id, reviewSchema.parse(req.body), req.user));
}

export async function remove(req, res) {
  await reviewService.deleteReview(req.params.id, req.user);
  res.status(204).end();
}
