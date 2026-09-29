import type { Request, Response } from 'express';
import * as content from '../models/content.model.js';

export async function listPlans(_req: Request, res: Response) {
  res.json(await content.findPlans());
}

export async function listTrainers(_req: Request, res: Response) {
  res.json(await content.findTrainers());
}

export async function listPrograms(req: Request, res: Response) {
  res.json(await content.findPrograms(req.query.featured === 'true'));
}

export async function listTestimonials(req: Request, res: Response) {
  const limit = Math.min(Number(req.query.limit ?? 20) || 20, 50);
  res.json(await content.findTestimonials(limit));
}

export async function listGallery(req: Request, res: Response) {
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  res.json(await content.findGallery(category));
}
