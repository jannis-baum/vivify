import { Request, Response, Router } from 'express';
import { queueMessage } from '../app.js';

export const router = Router();

// this route should only be used internally between vivify processes
router.post('/', async (req: Request, res: Response) => {
    const { path, command, value } = req.body;

    if (!path || !command || !value) {
        res.status(400).send('Bad request.');
        return;
    }

    queueMessage(path, `${command}: ${value}`);
    res.end();
});
