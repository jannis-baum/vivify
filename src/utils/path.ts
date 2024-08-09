import { exec } from 'child_process';
import { homedir } from 'os';
import { basename as pbasename, dirname as pdirname, parse as pparse } from 'path';
import config from '../config.js';
import { stat, readFile } from 'fs/promises';
import { promisify } from 'util';

const execPromise = promisify(exec);
export const pmime = async (path: string) => {
    if (process.platform === 'win32') {
        path = `C:${path.replaceAll('/', '\\')}`; // TODO: Some Windows hackery
    }
    const [{ stdout: mime }, stats] = await Promise.all([
        execPromise(`file --mime-type -b "${path}"`), // Path needs to be wrapped in double quotes on Windows
        stat(path),
    ]);
    // empty files can also be `application/x-empty`
    // -> we unify to `inode/x-empty`
    if (stats.size == 0) return 'inode/x-empty';
    // single byte files don't work well for mime recognition as they will
    // always be guessed as application/octet-stream
    // -> we return `text/plain` if the single byte is a printable character
    if (stats.size == 1) {
        const content = await readFile(path);
        const char = content.at(0);
        if (
            char !== undefined &&
            // tab            line feed        carriage return   printable character range
            (char === 0x09 || char === 0x0a || char === 0x0d || (char >= 0x20 && char <= 0x7e))
        )
            return 'text/plain';
    }
    return mime.trim();
};

export const pcomponents = (path: string) => {
    const parsed = pparse(path);
    const components = new Array<string>();
    // directory
    let dir = parsed.dir;
    while (dir !== '/' && dir !== '.') {
        components.unshift(pbasename(dir));
        dir = pdirname(dir);
    }
    // root
    if (parsed.root !== '') components.unshift(parsed.root);
    // base
    if (parsed.base !== '') components.push(parsed.base);
    return components;
};

export const urlToPath = (url: string) => {
    const path = decodeURIComponent(url.replace(/^\/(viewer|health)/, ''))
        .replace(/^\/~/, homedir())
        .replace(/\/+$/, '');
    return path === '' ? '/' : path;
};

export const pathToURL = (path: string, route: string = 'viewer') => {
    const withoutPrefix = path.startsWith('/') || path.startsWith('\\') ? path.slice(1) : path; // TODO: Windows hack
    return `/${route}/${encodeURIComponent(withoutPrefix).replaceAll('%2F', '/')}`;
};

export const preferredPath = (path: string): string =>
    config.preferHomeTilde && path.startsWith(homedir()) ? path.replace(homedir(), '~') : path;
