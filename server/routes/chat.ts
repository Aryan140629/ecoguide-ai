import { Router } from 'express';
import { rateLimit } from '../middleware/rateLimit';
import { validateChatRequest } from '../middleware/validation';
import { handleChatPost } from '../controllers/chatController';

const router = Router();

router.post('/', rateLimit, validateChatRequest, handleChatPost);

export default router;
