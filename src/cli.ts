import axios from 'axios';
import { existsSync } from 'fs';
import open from 'open';
import { resolve as presolve } from 'path';
import { address } from './config.js';
import { pathToURL, preferredPath } from './utils/path.js';

// exported for unit test
export const getPathAndLine = (
    target: string,
): { path: string | undefined; line: number | undefined } => {
    const exp = /^(?<path>(?:.*?)(?<!\\)(?:\\\\)*)(?::(?<line>\d+))?$/;
    const groups = target.match(exp)?.groups;
    if (groups === undefined || !groups['path']) {
        return { path: undefined, line: undefined };
    }
    const path = groups['path'].replace('\\:', ':').replace('\\\\', '\\');
    const line = groups['line'] ? parseInt(groups['line']) : undefined;
    return { path, line };
};

export const openFileAt = async (path: string) =>
    open(`${address}${pathToURL(preferredPath(path))}`);

const openTarget = async (target: string) => {
    const { path, line } = getPathAndLine(target);
    if (!path) {
        console.log(`Invalid target: ${target}`);
        return;
    }
    if (!existsSync(path)) {
        console.log(`File not found: ${path}`);
        return;
    }

    const resolvedPath = presolve(path);
    try {
        if (line !== undefined) {
            await axios.post(`${address}/_open`, {
                path: resolvedPath,
                command: 'SCROLL',
                value: line,
            });
        } else {
            await openFileAt(resolvedPath);
        }
    } catch {
        console.log(`Failed to open ${target}`);
    }
};

export const completeStartup = () => {
    if (process.env['NODE_ENV'] !== 'development') {
        // - viv executable waits for this string and then stops printing
        //   vivify-server's output and terminates
        // - the string itself is not shown to the user
        console.log('STARTUP COMPLETE');
    }
};

export const handleArgs = (): (() => Promise<void>) | undefined => {
    const args = process.argv.slice(2);
    const positionals: string[] = [];
    let parseOptions = true;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!(arg.startsWith('-') && parseOptions)) {
            positionals.push(arg);
            continue;
        }
        switch (arg) {
            case '-v':
            case '--version':
                console.log(`vivify-server ${process.env.VERSION ?? 'dev'}`);
                return;
            case '--':
                parseOptions = false;
                break;
            default:
                console.log(`Unknown option "${arg}"`);
        }
    }
    return async () => {
        await Promise.all(positionals.map((target) => openTarget(target)));
        completeStartup();
    };
};
