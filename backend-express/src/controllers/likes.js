import * as likeService from '../services/like.js';

export async function like(req, res) {
  res.json(await likeService.like(req.user._id, req.params.id));
}

export async function unlike(req, res) {
  res.json(await likeService.unlike(req.user._id, req.params.id));
}
