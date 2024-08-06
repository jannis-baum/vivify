import { createServer, get } from 'http';

import express from 'express';

import config, { address } from './config.js';
import { router as healthRouter } from './routes/health.js';
import { router as staticRouter } from './routes/static.js';
import { router as viewerRouter } from './routes/viewer.js';
import { router as openRouter } from './routes/_open.js';
import { setupSockets } from './sockets.js';
import { urlToPath } from './utils/path.js';
import { completeStartup, handleArgs } from './cli.js';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.locals.filepath = urlToPath(req.path);
    next();
});
app.use('/static', staticRouter);
app.use('/health', healthRouter);
app.use('/viewer', viewerRouter);
app.use('/_open', openRouter);

const server = createServer(app);

let shutdownTimer: NodeJS.Timeout | null = null;
export const { clientsAt, messageClients, openAndMessage } = setupSockets(
    server,
    () => {
        if (config.timeout > 0)
            shutdownTimer = setInterval(() => {
                // timeout when no clients are connected
                process.exit(0);
            }, config.timeout);
    },
    () => {
        if (shutdownTimer) clearInterval(shutdownTimer);
    },
);

const openTargetsAndCompleteStartup = handleArgs();
if (openTargetsAndCompleteStartup) {
    try {
        get(`${address}/health`, async () => {
            // server is already running
            await openTargetsAndCompleteStartup();
            process.exit(0);
        }).on('error', () => {
            // server is not running so we start it
            server.listen(config.port, openTargetsAndCompleteStartup);
        });
    } catch (error) {
        console.log(error);
        completeStartup();
    }
} else {
    completeStartup();
}
