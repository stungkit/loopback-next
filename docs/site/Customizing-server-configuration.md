---
lang: en
title: 'Customizing Server configuration'
keywords: LoopBack 4.0, LoopBack 4, Node.js, TypeScript, OpenAPI
sidebar: lb4_sidebar
permalink: /doc/en/lb4/Customizing-server-configuration.html
---

## Configuration

The REST server can be configured by passing a `rest` property inside your
RestApplication options. For example, the following code customizes the port
number that a REST server listens on.

```ts
const app = new RestApplication({
  rest: {
    port: 3001,
  },
});
```

### Configure the API Explorer

LoopBack allows externally hosted API Explorer UI to render the OpenAPI
endpoints for a REST server. Such URLs can be specified with `rest.apiExplorer`:

- url: URL for the hosted API Explorer UI, default to
  `https://explorer.loopback.io`.
- httpUrl: URL for the API explorer served over plain http to deal with mixed
  content security imposed by browsers as the spec is exposed over `http` by
  default. See https://github.com/loopbackio/loopback-next/issues/1603. Default
  to the value of `url`.

```ts
const app = new RestApplication({
  rest: {
    apiExplorer: {
      url: 'https://petstore.swagger.io',
      httpUrl: 'http://petstore.swagger.io',
    },
  },
});
```

#### Disable redirect to API Explorer

To disable redirect to the externally hosted API Explorer, set the config option
`rest.apiExplorer.disabled` to `true`.

```ts
const app = new RestApplication({
  rest: {
    apiExplorer: {
      disabled: true,
    },
  },
});
```

{% include note.html content="To completely disable API Explorer, we also need
to [disable the self-hosted REST API Explorer extension](./Self-hosted-REST-API-Explorer.md#disable-self-hosted-api-explorer)." %}

### Use a self-hosted API Explorer

Hosting the API Explorer at an external URL has a few downsides, for example a
working internet connection is required to explore the API. As a recommended
alternative, LoopBack comes with an extension that provides a self-hosted
Explorer UI. Please refer to
[Self-hosted REST API Explorer](./Self-hosted-REST-API-Explorer.md) for more
details.

### Customize CORS

[CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) is enabled
by default for REST servers with the following options:

```ts
{
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400,
  credentials: true,
}
```

The application code can customize CORS via REST configuration:

```ts
export async function main() {
  const options = {
    rest: {
      cors: {...},
    },
  };
  const app = new RestApplication(options);
}
```

To disable CORS, you can set the options to `{origin: false}`, that is:

```ts
const options = {
  rest: {
    cors: {origin: false},
  },
};
```

For a complete list of CORS options, see
https://github.com/expressjs/cors#configuration-options.

### Express settings

Override the default express settings and/or assign your own settings:

```ts
const app = new RestApplication({
  rest: {
    expressSettings: {
      'x-powered-by': false,
      env: 'production',
      ...
    },
  },
});
```

Checkout `express` [documentation](http://expressjs.com/fr/api.html#app.set) for
more details about the build-in settings.

### Configure the Base Path

Sometime it's desirable to expose REST endpoints using a base path, such as
`/api`. The base path can be set as part of the RestServer configuration.

```ts
const app = new RestApplication({
  rest: {
    basePath: '/api',
  },
});
```

The `RestApplication` and `RestServer` both provide a `basePath()` API:

```ts
const app: RestApplication;
// ...
app.basePath('/api');
```

With the `basePath`, all REST APIs and static assets are served on URLs starting
with the base path.

### Configure the router

The router can be configured to enforce `strict` mode as follows:

1. `strict` is true:
   - request `/orders` matches route `/orders` but not `/orders/`
   - request `/orders/` matches route `/orders/` but not `/orders`

2. `strict` is false (default)
   - request `/orders` matches route `/orders` first and falls back to
     `/orders/`
   - request `/orders/` matches route `/orders/` first and falls back to
     `/orders`

See `strict routing` at http://expressjs.com/en/4x/api.html#app for more
information.

### Configure the request body parser options

We can now configure request body parser options as follows:

```ts
const app = new Application({
  rest: {requestBodyParser: {json: {limit: '1mb'}}},
});
```

The value of `rest.requestBodyParser` will be bound to
RestBindings.REQUEST_BODY_PARSER_OPTIONS. See
[Customize request body parser options](Parsing-requests.md#customize-parser-options)
for more details.

### `rest` options

| Property            | Type                      | Purpose                                                                                                                                                                                                                                                                                                                             |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| host                | string                    | Specify the hostname or ip address on which the RestServer will listen for traffic.                                                                                                                                                                                                                                                 |
| port                | number                    | Specify the port on which the RestServer listens for traffic.                                                                                                                                                                                                                                                                       |
| protocol            | string (http/https)       | Specify the protocol on which the RestServer listens for traffic.                                                                                                                                                                                                                                                                   |
| gracePeriodForClose | number                    | Specify the grace period in milliseconds to allow the RestServer to finish processing in-flight requests and reject new requests from keep-alive connections when the server is being stopped. The default value is `Infinity` (don't force-close). If you want to immediately destroy all sockets upon stop, set its value to `0`. |
| basePath            | string                    | Specify the base path that RestServer exposes http endpoints.                                                                                                                                                                                                                                                                       |
| key                 | string                    | Specify the SSL private key for https.                                                                                                                                                                                                                                                                                              |
| cert                | string                    | Specify the SSL certificate for https.                                                                                                                                                                                                                                                                                              |
| cors                | CorsOptions               | Specify the CORS options.                                                                                                                                                                                                                                                                                                           |
| sequence            | SequenceHandler           | Use a custom SequenceHandler to change the behavior of the RestServer for the request-response lifecycle.                                                                                                                                                                                                                           |
| openApiSpec         | OpenApiSpecOptions        | Customize how OpenAPI spec is served                                                                                                                                                                                                                                                                                                |
| apiExplorer         | ApiExplorerOptions        | Customize how API explorer is served                                                                                                                                                                                                                                                                                                |
| requestBodyParser   | RequestBodyParserOptions  | Customize how request body is parsed                                                                                                                                                                                                                                                                                                |
| router              | RouterOptions             | Customize how trailing slashes are used for routing                                                                                                                                                                                                                                                                                 |
| listenOnStart       | boolean (default to true) | Control if the server should listen on http/https when it's started                                                                                                                                                                                                                                                                 |

## Add servers to application instance

You can add server instances to your application via the `app.server()` method
individually or as an array using `app.servers()` method. Using `app.server()`
allows you to uniquely name your binding key for your specific server instance.
The following example demonstrates how to use these functions:

```ts
import {Application} from '@loopback/core';
import {RestServer} from '@loopback/rest';

export class HelloWorldApp extends Application {
  constructor() {
    super();
    // This server instance will be bound under "servers.fooServer".
    this.server(RestServer, 'fooServer');
    // Creates a binding for "servers.MQTTServer" and a binding for
    // "servers.SOAPServer";
    this.servers([MQTTServer, SOAPServer]);
  }
}
```

You can also add multiple servers in the constructor of your application class
as shown [here](Application.md#servers).

### Enhance OpenAPI Specification

The REST server exposes a function `getApiSpec()` to retrieve its OpenAPI
specifications:

```ts
// in code, retrieve the OpenAPI spec by `getApiSpec()`
const spec = await app.restServer.getApiSpec();
```

An application's OpenAPI specification is mainly generated from
[controllers](https://loopback.io/doc/en/lb4/Controllers.html) and their
members. Besides the controller, other artifacts should also be able to
contribute specifications. Therefore we introduced
[OpenAPI specification enhancer](Extending-OpenAPI-specification.md) to
customize it.

You can read the page
[Extending OpenAPI specification](Extending-OpenAPI-specification.md) to get
familiar with its concepts and usages.

The REST server has a built-in enhancer service to scan all the enhancers bound
to the application and apply them by default. To add your own enhancer, just
bind it to your application and the server will automatically pick it up:

```ts
import {RestApplication} from '@loopback/rest';

export class SomeApp extends RestApplication {
  constructor(options: ApplicationConfig = {}) {
    super(options);
    this.add(createBindingFromClass(SomeSpecEnhancer));
  }
}
```

If you contribute the enhancer from a [component](Component.md), create the
binding in this way:

```ts
import {createBindingFromClass} from '@loopback/core';
export class SomeComponent implements Component {
  bindings = [createBindingFromClass(SomeSpecEnhancer)];
}
```
