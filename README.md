# squirrelly-server

![](https://github.com/SquirrellySquirrel/squirrelly-server/actions/workflows/node.js.yml/badge.svg)

## Local Development

* node: v16.x
* npm: 7.x
* mysql: 8.x

1. Copy `.env.example` to `.env[.profile]` (e.g. `.env.dev`) with actual environment variables.

2. Install dependencies:

```console
$ npm install
```

3. Build:

```console
$ npm run build
```

4. Start server:

```console
$ npm run start
```

5. Start server locally (no need to build):

```console
$ npm run start:dev
```

6. Run tests:

```console
$ npm test
```

7. Run linter:

```console
$ npm run lint
```
