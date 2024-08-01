import { lstatSync, readFileSync } from 'fs';
import { join as pjoin } from 'path';
import { homedir } from 'os';

import { Request, Response, Router } from 'express';

import { clientsAt, messageClients } from '../app.js';
import config from '../config.js';
import { pcomponents, pmime, preferredPath, urlToPath } from '../utils/path.js';
import { renderDirectory, renderTextFile, shouldRender } from '../parser/parser.js';

export const router = Router();

const liveContent = new Map<string, string>();

const pageTitle = (path: string) => {
    const comps = pcomponents(preferredPath(path));
    if (config.pageTitle) {
        return eval(`
            const components = ${JSON.stringify(comps)};
            ${config.pageTitle};
        `);
    } else return pjoin(...comps.slice(-2));
};

if (config.preferHomeTilde) {
    router.use((req, res, next) => {
        if (req.method === 'GET' && req.path.startsWith(homedir())) {
            res.redirect(req.originalUrl.replace(homedir(), '/~'));
        } else {
            next();
        }
    });
}

router.get(/.*/, async (req: Request, res: Response) => {
    const path = res.locals.filepath;

    let body = liveContent.get(path);
    if (!body) {
        try {
            if (lstatSync(path).isDirectory()) {
                body = renderDirectory(path);
            } else {
                const data = readFileSync(path);
                const mime = pmime(path);
                if (!shouldRender(mime)) {
                    res.setHeader('Content-Type', mime).send(data);
                    return;
                }

                body = renderTextFile(data.toString(), path);
            }
        } catch (error) {
            res.status(500).send(String(error));
            return;
        }
    }

    let title = 'custom title error';
    try {
        title = pageTitle(path);
    } catch (error) {
        body = `Error evaluating custom page title: ${error as string}`;
    }

    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${title}</title>
                <link rel="stylesheet" type="text/css" href="/static/colors.css"/>
                <link rel="stylesheet" type="text/css" href="/static/style.css"/>
                <link rel="stylesheet" type="text/css" href="/static/markdown.css"/>
                <link rel="stylesheet" type="text/css" href="/static/highlight.css">
                <link rel="stylesheet" type="text/css" href="/static/ipynb.css">
                <link rel="stylesheet" type="text/css" href="/static/katex/katex.css">
                ${config.styles ? `<style type="text/css">${config.styles}</style>` : ''}
            <body>
                <div id="body-content">
                    ${body}
                </div>
            </body>
            <script>
                window.VIV_PORT = "${config.port}";
                window.VIV_PATH = "${urlToPath(req.path)}";
            </script>
            ${config.scripts ? `<script type="text/javascript">${config.scripts}</script>` : ''}
            <script type="text/javascript" src="/static/client.js"></script>
        </html>
    `);
});

// POST:
// - `cursor`: scroll to corresponding line in source file
// - `content`: set content for live viewer
// - `reload`: set live content to file content (overwrites `content`)
router.post(/.*/, async (req: Request, res: Response) => {
    const path = res.locals.filepath;
    const { cursor, reload } = req.body;
    let { content } = req.body;

    if (reload) {
        const mime = pmime(path);
        if (!shouldRender(mime)) {
            res.status(400).send('Reload is only permitted on rendered files');
            return;
        }
        content = readFileSync(path).toString();
    }
    const clients = clientsAt(path);
    if (content) {
        const rendered = renderTextFile(content, path);
        liveContent.set(path, rendered);
        messageClients(clients, `UPDATE: ${rendered}`);
    }
    if (cursor) messageClients(clients, `SCROLL: ${cursor}`);

    res.send({ clients: clients.length });
});

router.delete(/.*/, async (req: Request, res: Response) => {
    const path = req.path;
    let clientCount = 0;

    if (path === '/') {
        const paths = [...liveContent.keys()];
        liveContent.clear();
        clientCount = paths.reduce<number>((count, path) => {
            const clients = clientsAt(path);
            messageClients(clients, 'RELOAD: 1');
            return count + clients.length;
        }, 0);
    } else {
        const clients = clientsAt(path);
        if (liveContent.delete(path)) {
            messageClients(clients, 'RELOAD: 1');
            clientCount = clients.length;
        }
    }
    res.send({ clients: clientCount });
});
