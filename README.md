# Run Kong Gateway in DB-less mode with Docker

[Kong Gateway](https://docs.konghq.com/gateway/3.1.x/) is a lightweight, fast, and flexible cloud-native API gateway. An API gateway is a reverse proxy that lets you manage, configure, and route requests to your APIs.

This repo contains simple guidence of running Kong Gateway in DB-less mode and its configuration example. This also provides simple app (REST and gRPC) to help you test your Kong Gateway deployment.


**Kong Gateway** can be run without a database using only in-memory storage for entities. We call this DB-less mode. When running Kong Gateway DB-less, the configuration of entities is done in a second configuration file, in YAML or JSON, using declarative configuration.
To know more about DB-less deployment mode in Kong, yau can read from the docs [here](https://docs.konghq.com/gateway/3.1.x/production/deployment-topologies/db-less-and-declarative-config/).


## Run Kong
- Read [`Deploy_Kong_REST.md`](./Deploy_Kong_REST.md) if you want to run Kong Gateway to proxying REST request
- Read [`Deploy_Kong_gRPC.md`](./Deploy_Kong_gRPC.md) if you want to run Kong Gateway to proxying gRPC request