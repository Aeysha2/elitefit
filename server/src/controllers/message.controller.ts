import type { Request, Response } from 'express';
import * as messages from '../models/message.model.js';
import { HttpError } from '../utils/httpError.js';

export async function createMessage(req: Request, res: Response) {
  const id = await messages.insertMessage({
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone || null,
    content: req.body.content,
  });
  res.status(201).json({ id });
}

export async function listMessages(_req: Request, res: Response) {
  res.json(await messages.findMessages());
}

export async function updateMessage(req: Request, res: Response) {
  if (!(await messages.markMessageRead(Number(req.params.id), req.body.isRead))) {
    throw new HttpError(404, 'NOT_FOUND', 'Message introuvable.');
  }
  res.status(204).end();
}
