# Architecture overview

intro text

## Scope of this repository

This repo includes just main Vivify which aims to be very configurable and
easily integrable. Everything else (e.g. vivify.vim) are their own projects with
their own repos

## Executables

we have two executables: `viv` and `vivify-server`:

- `viv` is just a small wrapper that
  1. runs Vivify Server
  2. forwards everything Vivify Server prints to `stdout` to its own `stdout`
     until the server prints `STARTUP COMPLETE`
  3. disowns the server process so it keeps running in the background while
     `viv` can terminate
- `vivify-server` is the actual Node.js app that does almost everything and is
  described in the rest of this doc

## Vivify Server overview

- (focus on `src/app.ts`) When `vivify-server` is called, there are two
  scenarios which we distinguish through the [`/health` endpoint](docs/api.md):
  1. There is already another instance of Vivify Server running: We have to
     reuse that instance and have it open the requested viewer.
  2. There is no other instance running: We have to start the server and
     then handle the requests ourselves.
- Vivify Server is
  1. an [Express](http://expressjs.com) server that serves the
     [API](docs/api.md) and the viewers
  2. (focus on `src/sockets.ts`) a WebSocket server that keeps 1 socket
     connection with each client (viewer browser tab) to
     1. be able to manipulate clients, e.g. for editor integration
     2. know when there are no clients left so we can shut down Vivify Server
- rendering files happens in the `src/parser` directory
  - for Markdown we use [markdown-it](https://www.npmjs.com/package/markdown-it)
    and most Markdown features can be handled with plugins from there
  - Notebook rendering is implemented from scratch but by heavily relying on the
    existing ability render Markdown

## Build infrastructure overview

- we use [Node SEA](https://nodejs.org/api/single-executable-applications.html)
  which is still in beta to compile Vivify Server into a single executable
  without needing a Node dependency
- this is why we can't simply use native Express static router but had to come
  up with a custom solution in `src/routes/static.ts`:
  - at development time, we just serve whatever is in the `static/` directory
  - at production time we access all contents of the `static/` directory through
    an archive that is included as an asset in the SEA
