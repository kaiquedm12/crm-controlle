import { Router } from 'express';
import { MessagesService } from './application/messages-service';
import { MessagesController } from './controllers/messages-controller';

export const messagesRoutes = Router();
const messagesController = new MessagesController(new MessagesService());

messagesRoutes.get('/', messagesController.list);
messagesRoutes.post('/send', messagesController.send);
