# Vivify's API

In addition to the command line interface `viv`, Vivify has HTTP endpoints that
are be used to integrate it into other applications, such as making editor
plugins for live previews.

## Path encoding

Vivify's endpoints are often accessed with the pattern `/<endpoint>/<path>`
where path is a
[percent-encoded](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)
path in the file system. For paths that follow UNIX naming conventions, this
means that endpoints are be accessed directly at the literal paths. For example,
accessing `<endpoint>` for a file at `/Users/me/my-file.md` is done through the
URL.

```txt
/<endpoint>/Users/me/my-file.md
```

For paths that have special characters such as spaces, use
[percent-encoding](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding).
E.g. to access `<endpoint>` for a file at `Users/me/my file.md`, it will be the
following.

```txt
/<endpoint>/Users/me/my%20file.md
```

## Endpoints

Vivify has two routes of endpoints, `/health`, and `/viewer`.

### `/health`

This endpoint is used for checking the status of Vivify Server and its clients
(connected viewers). Sending a `GET` request directly to `/health` will reply
with status 200 if Vivify Server is running. Sending a `GET` request to
`/health/<path>` (as defined in [Path encoding](#path-encoding)) will reply with
status 200 if there are clients connected at the given path, or with 404 if
there aren't.

### `/viewer`

This endpoint is used to manipulate connected clients.

Sending a `POST` to `/viewer/<path>` (as defined in [Path
encoding](#path-encoding)) will always reply with the following response.

```typescript
{
  "clients": number     // number of clients connected at <path>
}
```

The request can include a body with the following optional fields.

```typescript
{
  "content": string,    // Live update the entire file's content to the given
                        // value.
  "cursor": number,     // For markdown files, scroll all viewers to the content
                        // corresponding to the given line in the source file.
  "reload": boolean     // Live update the viewer based on the current content
                        // on disk. Note that this overrides "content".
}
```

Sending a `DELETE` request to `/viewer` will fully reload all connected clients
at any paths and clear all cached updated live content. Sending a `DELETE`
request to `/viewer/<path>` will do the same for all clients at the given path.
