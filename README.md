# squirrelly-server

![](https://github.com/SquirrellySquirrel/squirrelly-server/actions/workflows/node.js.yml/badge.svg)

## Local Development

- node: v18.20.x
- npm: 10.5.x
- mysql: 8.x
- (optional) docker and docker-compose

### Setup

1. Copy `.env.example` to `.env[.profile]` (e.g. `.env.dev`) with actual environment variables.

2. If using docker, run `docker-compose up -d` to start MySQL and create databases; otherwise manually run `./docker/mysql/createdb.sql`.

3. Install dependencies:

```console
$ npm install
```

### Commands

- Build and start server:

```console
$ npm run build
$ npm run start
```

- Start server locally (no need to build):

```console
$ npm run start:dev
```

- Run migrations:

```console
$ npm migration
$ npm migration:test
```

- Run tests:

```console
$ npm test
```

- Run linter:

```console
$ npm run lint
```

### API doc

After starting the server, the Swagger UI can be found at `http://localhost:8000/api-docs`.
