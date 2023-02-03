# Kong Gateway in DB-less mode Guideline

This guide provides steps to run **Kong Gateway** with Docker without a database (DB-less mode). It'll specific to proxying REST Request (from client) to REST Upstream Service

## Prerequisites
To completely run this guide, you need to ensure some things:
- [Docker](https://docs.docker.com/engine/install/ubuntu/) is installed in your machine.
- [nodejs](https://nodejs.org/en/download/) and [npm](https://docs.npmjs.com/cli/v9) installed.
- OS: Ubuntu 20.04 (this guide created in Ubuntu 20.04 Environment, of you using other OS  then it needs some command adjustments)

## Run Kong Gateway
### 1. Run simple REST Service. 

This is optional step, if you already have REST app running in server. Then you can skip this one.

This repo already provide simple REST Service, just open terminal in `member-app` folder, and run command 
```shell
npm install && node index.js
```
The simple REST app should be run on Port 3000.

### 2. Prepare your declarative configuration file in .yml or .json format. 

The Kong declarative configuration file consists of lists of Kong entities and their attributes. Add whatever core entities (Services, Routes, Plugins, Upstreams, etc) you need to this file.

For example, a simple configuration file with a Service and a Route may look something like this:
```yml
 _format_version: "3.0"
 _transform: true

 services:
 - url: http://172.17.0.1:3000
   name: member_service
   routes:
   - name: member_route
     paths:
     - /member
     strip_path: true
```
The file already provided in this repo with name [`kong.yml`](./kong.yml).

You can change `services.url` value with your own REST app URL. In this guide, we use simple REST app that deployed in the previous step.

See the [declarative configuration schema](https://github.com/Kong/deck/blob/main/file/kong_json_schema.json) for all configuration options.

### 3. Run Kong Gateway container

From the same directory where `kong.yml` take place, run the following command (in new terminal) to start Kong Gateway container:
```sh
./run-kong.sh
```
The content of  [`run-kong.sh`](./run-kong.sh) file is:
```sh
#!/bin/bash

docker run -d --name kong-dbless \
  --network=host \
  -v "$(pwd):/kong/declarative/" \
  -e "KONG_DATABASE=off" \
  -e "KONG_DECLARATIVE_CONFIG=/kong/declarative/kong.yml" \
  -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
  -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
  -e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
  -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
  -e "KONG_ADMIN_LISTEN=0.0.0.0:8001" \
  kong/kong-gateway:3.1.1.1
```
Where:

- `--name` and `--network`: The name of the container to create, and the Docker network it communicates on.
- `-v $(pwd):/path/to/target/`: Mount the current directory on your local filesystem to a directory in the Docker container. This makes the `kong.yml` file visible from the Docker container.
- `KONG_DATABASE`: Sets the database to `off` to tell Kong not to use any backing database for configuration storage.
- `KONG_DECLARATIVE_CONFIG`: The path to a declarative configuration file inside the container. This path **should match the target path** that you’re mapping with -v.
- `All _LOG` parameters: set filepaths for the logs to output to, or use the values in the example to print messages and errors to stdout and stderr.
- `KONG_ADMIN_LISTEN`: The port that the Kong Admin API listens on for requests.

*Note: we use --network=host because the example run on the host network (Kong in docker need access to 'localhost of host'). If the REST server available externally (using DNS or IP address), we can omit --network=host and use port bindings instead. See [run-kong-bridge.sh](./run-kong-bridge.sh) for example*

### 4. Verify that Kong Gateway is running

Verify that Kong Gateway is running by run command:
```sh
curl http://localhost:8001
```

Or you can check list of Service
```sh
curl http://localhost:8001/services
```

The response may looks like:
```json
{
  "next": null,
  "data": [
    {
      "path": null,
      "tls_verify_depth": null,
      "host": "172.17.0.1",
      "tags": null,
      "ca_certificates": null,
      "id": "ce525a6f-659d-5766-a156-0e204709ac8a",
      "retries": 5,
      "updated_at": 1674730862,
      "port": 3000,
      "protocol": "http",
      "client_certificate": null,
      "tls_verify": null,
      "write_timeout": 60000,
      "created_at": 1674730862,
      "enabled": true,
      "connect_timeout": 60000,
      "name": "member_service",
      "read_timeout": 60000
    }
  ]
}
```

### 5. Kong Deployment is Finish! Make sure it is working

Now, you can test the Kong Gateway with registered Service and Route, below is the example request:
```sh
curl http://localhost:8000/member/api/v1/members
```

The response may looks like:
```json
{
  "members": [
    {
      "name": "dino",
      "place": "jakarta"
    },
    {
      "name": "doni",
      "place": "bandung"
    }
  ]
}
```

Lets try other endpoint and method:
```sh
curl -X POST -H 'Content-Type: application/json' -d '{"name": "Tcala", "place": "Wakanda"}' http://localhost:8000/member/api/v1/members
```

The response may looks like:
```json
{
  "data": {
    "name": "Tcala",
    "place": "Wakanda"
  }
}
```

## Update Kong Gateway Configuration
In case when Kong Gateway is up and running, we can update configuration by Kong Admin API, using `/config` endpoint. 

**Note: The `/config` endpoint replaces the entire set of entities in memory with the ones specified in the given file.*

From the previous steps, we already have the runnning Kong Gateway. Let say we want to update the configuration with details:
- Add Github API Service (remote service) and it's Route
- Apply **rate-limiting** plugin

Todo do that, we need to convert [`kong.yml`](./kong.yml) to JSON format. We can use [yaml tools](https://onlineyamltools.com/convert-yaml-to-json) to convert yml/yaml to JSON. The result is below:

```json
{
  "_format_version": "3.0",
  "_transform": true,
  "services": [
    {
      "url": "http://172.17.0.1:3000",
      "name": "member_service",
      "routes": [
        {
          "name": "member_route",
          "paths": [
            "/member"
          ],
          "strip_path": true
        }
      ]
    }
  ]
}
```

Then, add Github API Service and Route, also apply **rate limiting** plugin. The configuration become:

```json
{
  "_format_version": "3.0",
  "_transform": true,
  "services": [
    {
      "url": "http://172.17.0.1:3000",
      "name": "member_service",
      "routes": [
        {
          "name": "member_route",
          "paths": [
            "/member"
          ],
          "strip_path": true
        }
      ]
    },
    {
      "url": "https://api.github.com",
      "name": "remote_git_service",
      "routes": [
        {
          "name": "remote_git_route",
          "paths": [
            "/git"
          ],
          "strip_path": true
        }
      ]
    }
  ],
  "plugins": [
    {
      "name": "rate-limiting",
      "service": "member_service",
      "config": {
        "minute": 5,
        "policy": "local"
      }
    }
  ]
}
```

Send the configuration above to Kong `/config` endpoint
![test](images/kong-dbless.png)

Configuration update is complete. Now, You can test that the new configuration whether applied properly or not.

Invoke Github Service from Kong Gateway:
```sh
curl http://localhost:8000/git
```
It should be responses with http 200 and long payload.

To check **rate-limiting** plugin is working, we can invoke Member Service (`curl http://localhost:8000/member`) more than 5 times in a minute. At 6th invocation, it will response with:
```json
{
  "message": "API rate limit exceeded"
}
```
It is indicates that our plugin is working.


## Applying Kong JWT Plugin
Kong JWT Plugin serves as the JWT authorizer. It authenticates the JWT in the HTTP request by verifying that token’s claims and ensuring a trusted party signed it. Then, depending on whether these steps were successful, Kong Gateway routes the upstream services request.

Keep in mind that authentication in this context means validating the user’s credentials. That’s the job of the JWT plugin. There’s no way to know how a user got a valid JWT. The system just knows that the user has one and is presenting it for authentication. If the JWT is authentic, you can be confident that the user is who they say.

### 1. Setup Keycloak Server
**This is optional**, if you already have Keycloak Server (or other JWT Issuer/Auth Server) running then you can skip this. In this case, Keycloak Server act as JWT Issuer Server, then we can use it to produce JWT to test Kong JWT Plugin.

You can follow [this guide](https://www.keycloak.org/getting-started/getting-started-docker) to run Keycloak Server. Then, crete: 
- Realm with name `foo-realm`
- Client with name `foo-client`
- and User with name `foo-user`

### 2. Setup Jwt Plugin Configuration
Firstly, add **Kong JWT Plugin definition** in your Kong declarative configuration. Below is the example: 
```json
"plugins": [
  {
    "name": "jwt",
    "enabled": true,
    "service": "member_service",
    "config": {
      "secret_is_base64": false,
      "claims_to_verify": [
        "exp"
      ],
      "key_claim_name": "iss"
    }
  }
]
```
```yaml
plugins:
  - name: jwt
    enabled: true
    service: member_service
    config:
      secret_is_base64: false
      claims_to_verify:
        - exp
      key_claim_name: iss
```
As you can see above, we add plugin named `jwt` and attach it to `member_service` (if you delete the `service` field, then plugin will attach globally. Meaning that the plugin will attach to all services). For its [`config options`](https://docs.konghq.com/hub/kong-inc/jwt/#parameters), tell the plugin to check the `exp` value to verify that the access token has not expired. It also check the claim by token issuer (`iss`).

To make the plugin works, you need to create a Consumer and associate it to one or more JWT credentials (holding the public and private keys used to verify the token). The Consumer represents developers who is using the upstream services.
Below is the example of Consumer definition:
```json
"consumers": [
  {
    "username": "the_users"
  }
]
```
```yaml
consumers:
  - username: the_users
```

Next, add JWT Credentials and associate it with Consumer that we created before.
```json
"jwt_secrets": [
  {
    "consumer": "the_users",
    "key": "http://localhost:8080/realms/foo-realm",
    "algorithm": "RS256",
    "rsa_public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzpqrQi4vpMCqQwHDV+2N\nPKcb54z1LIL6GtWm2ubT29iXiGGgfZc+lXlUNWnXbRvkL7v8MwbfPOnTu6FIfrFL\n4XZWoaaJFs4cT3Jt2LR8ZymVkwrfquCcfSJnOrskyI1eHA1ujnfC2LjuOFzkPSNu\nEk6t9/Z/zs8WP8axVvSUkB5EyvcZDoqeOBZj64OWOj07PJCOuSYEyb5Wq53Wf+a2\ngYDD8FjcjAAt+Be0PJITFHm3Z+ldt4bFL1oIkrHkAEE5c7pd18w5HDtgjmYWPs7O\nuUIibVfEy9nF6faLKq/16RYwSi87c45cOnBSIAEB7DiZKz5wsK1Ogw1A6JTYBi6N\ncwIDAQAB\n-----END PUBLIC KEY-----\n"
  }
]
```
```yaml
jwt_secrets:
  - consumer: the_users
    key: http://localhost:8080/realms/foo-realm
    algorithm: RS256
    rsa_public_key: |
      -----BEGIN PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzpqrQi4vpMCqQwHDV+2N
      PKcb54z1LIL6GtWm2ubT29iXiGGgfZc+lXlUNWnXbRvkL7v8MwbfPOnTu6FIfrFL
      4XZWoaaJFs4cT3Jt2LR8ZymVkwrfquCcfSJnOrskyI1eHA1ujnfC2LjuOFzkPSNu
      Ek6t9/Z/zs8WP8axVvSUkB5EyvcZDoqeOBZj64OWOj07PJCOuSYEyb5Wq53Wf+a2
      gYDD8FjcjAAt+Be0PJITFHm3Z+ldt4bFL1oIkrHkAEE5c7pd18w5HDtgjmYWPs7O
      uUIibVfEy9nF6faLKq/16RYwSi87c45cOnBSIAEB7DiZKz5wsK1Ogw1A6JTYBi6N
      cwIDAQAB
      -----END PUBLIC KEY-----
```
Where:
1. `consumer` (required): The id or username property of the consumer entity to associate the credentials to.
2. `key` (optinal): A unique string identifying the key to claim. If left out, it will be auto-generated. Because we use `iss` as key-claim, fill the `key` with the value of iss we want to claim as valid.
3. `algorithm` (optional, default HS256): The algorithm used to verify the token’s signature. Can be HS256, HS384, HS512, RS256, RS384, RS512, ES256, or ES384.
4. `rsa_public_key` (optional): If algorithm is RS256, RS384, RS512, ES256, or ES384, the public key (in PEM format) to use to verify the token’s signature.
5. `secret` (optional): If algorithm is HS256, HS384, or HS512, the secret used to sign JWTs for this credential. If left out, will be auto-generated. 

At the config above, the value of `key` is `http://localhost:8080/realms/foo-realm`, meaning that the token which not issued (`iss`) by `http://localhost:8080/realms/foo-realm` will mark as invalid/unauthorized.

We set `algorithm` with `RS256`. So we need to provide the `rsa_public_key`. We can get the `rsa_public_key` from Keycloak Server (or other JWT Issuer/Auth Server). In this guide, we already run Keycloak Server and created `foo-realm`. Just access the URL `http://localhost:8080/realms/foo-realm`:

![aa](./images/kong-realm-public-key.png)

As you can see there is `public_key`, but we can't use it directly because we need to convert it to **PEM** format. You can do it by just to break String `public_key` into multiple lines by 64 size separate by new line, then add -----BEGIN PUBLIC KEY----- at the beginning, and add -----END PUBLIC KEY----- at the end.

Script in this [stackoverflow discussion](https://stackoverflow.com/questions/73595348/keycloak-public-key-format/73596690#73596690) will help you. 


### 3. Update Kong Config
After add JWT Plugin Configuration, below is complete Kong Configuration:
```json
{
    "_format_version": "3.0",
    "_transform": true,
    "services": [
        {
            "url": "http://172.17.0.1:3000",
            "name": "member_service",
            "routes": [
                {
                    "name": "member_route",
                    "paths": [
                        "/member"
                    ],
                    "strip_path": true
                }
            ]
        },
        {
            "url": "https://api.github.com",
            "name": "remote_git_service",
            "routes": [
                {
                    "name": "remote_git_route",
                    "paths": [
                        "/git"
                    ],
                    "strip_path": true
                }
            ]
        }
    ],
    "plugins": [
        {
            "name": "jwt",
            "enabled": true,
            "service": "member_service",
            "config": {
                "secret_is_base64": false,
                "claims_to_verify": [
                    "exp"
                ],
                "key_claim_name": "iss"
            }
        }
    ],
    "consumers": [
        {
            "username": "the_users"
        }
    ],
    "jwt_secrets": [
        {
            "consumer": "the_users",
            "algorithm": "RS256",
            "key": "http://localhost:8080/realms/foo-realm",
            "rsa_public_key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzpqrQi4vpMCqQwHDV+2N\nPKcb54z1LIL6GtWm2ubT29iXiGGgfZc+lXlUNWnXbRvkL7v8MwbfPOnTu6FIfrFL\n4XZWoaaJFs4cT3Jt2LR8ZymVkwrfquCcfSJnOrskyI1eHA1ujnfC2LjuOFzkPSNu\nEk6t9/Z/zs8WP8axVvSUkB5EyvcZDoqeOBZj64OWOj07PJCOuSYEyb5Wq53Wf+a2\ngYDD8FjcjAAt+Be0PJITFHm3Z+ldt4bFL1oIkrHkAEE5c7pd18w5HDtgjmYWPs7O\nuUIibVfEy9nF6faLKq/16RYwSi87c45cOnBSIAEB7DiZKz5wsK1Ogw1A6JTYBi6N\ncwIDAQAB\n-----END PUBLIC KEY-----\n"
        }
    ]
}
```
```yaml
_format_version: '3.0'
_transform: true
services:
  - url: http://172.17.0.1:3000
    name: member_service
    routes:
      - name: member_route
        paths:
          - /member
        strip_path: true
  - url: https://api.github.com
    name: remote_git_service
    routes:
      - name: remote_git_route
        paths:
          - /git
        strip_path: true
plugins:
  - name: jwt
    enabled: true
    service: member_service
    config:
      secret_is_base64: false
      claims_to_verify:
        - exp
      key_claim_name: iss
consumers:
  - username: the_users
jwt_secrets:
  - consumer: the_users
    algorithm: RS256
    key: http://localhost:8080/realms/foo-realm
    rsa_public_key: |
      -----BEGIN PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzpqrQi4vpMCqQwHDV+2N
      PKcb54z1LIL6GtWm2ubT29iXiGGgfZc+lXlUNWnXbRvkL7v8MwbfPOnTu6FIfrFL
      4XZWoaaJFs4cT3Jt2LR8ZymVkwrfquCcfSJnOrskyI1eHA1ujnfC2LjuOFzkPSNu
      Ek6t9/Z/zs8WP8axVvSUkB5EyvcZDoqeOBZj64OWOj07PJCOuSYEyb5Wq53Wf+a2
      gYDD8FjcjAAt+Be0PJITFHm3Z+ldt4bFL1oIkrHkAEE5c7pd18w5HDtgjmYWPs7O
      uUIibVfEy9nF6faLKq/16RYwSi87c45cOnBSIAEB7DiZKz5wsK1Ogw1A6JTYBi6N
      cwIDAQAB
      -----END PUBLIC KEY-----
```
*Note: we removed **rate-limiting** plugin for shorten our new config*

Send the configuration above to Kong `/config` endpoint:
```sh
curl -X POST -d '{$yourKongConfigJson}' http://localhost:8001/config 
```

### 4. Test the APIs
Now, we can test the APIs. After added Kong JWT Plugin, our requests need to include `Authorization` header contains JWT.

Lets try to invoke API without JWT:
```sh
curl http://localhost:8000/member/api/v1/members
```
The response is:
```json
{
    "message": "Unauthorized"
}
```
Lets try with Authorization header. Firstly we must provide the JWT. We can issuing it from Keycloak Server that we run before. Lets get the JWT of `foo-user` from `foo-client` in `foo-realm`. Below is the command:
```sh
curl -L -X POST 'http://localhost:8080/realms/foo-realm/protocol/openid-connect/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'client_id=foo-client' \
--data-urlencode 'grant_type=password' \
--data-urlencode 'scope=openid' \
--data-urlencode 'username=foo-user' \                                      
--data-urlencode 'password=foo-user'
```
And we get the JWT:
```json
{
  "access_token":"eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ1cXprRG1GbTFuVFV6X0YwazRjNGRRcVU4VzM2RF9qTnFhZDJGbERWQjJVIn0.eyJleHAiOjE2NzUxNDUyODgsImlhdCI6MTY3NTE0NDk4OCwianRpIjoiOWUzODZjNzQtN2RkOC00MGRiLWFmMzItMDg2NTk5ZjVlNzAxIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9mb28tcmVhbG0iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiZmZlMTVjNzktMjFkMS00ODRjLTk0OTMtZmIzN2NlYTNkNDY1IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZm9vLWNsaWVudCIsInNlc3Npb25fc3RhdGUiOiI5ZjJlYjVmNS00NzM2LTRkZmItYjc0My1kNTdkMjk0NDRmZDYiLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtZm9vLXJlYWxtIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJzaWQiOiI5ZjJlYjVmNS00NzM2LTRkZmItYjc0My1kNTdkMjk0NDRmZDYiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsInByZWZlcnJlZF91c2VybmFtZSI6ImZvby11c2VyIiwiZ2l2ZW5fbmFtZSI6IiIsImZhbWlseV9uYW1lIjoiIn0.QTOl5FAFCBx85FgCzXF3tX3B4-ZwtiOpMXtNG2pkqV3rAJFiQ06m0EXcJvDIR9snQ9WWF0B8n_7_65Z5Jw8d9wm4V-4Y-Ce2c_Ic8FDXm_TK579NHEsiFHdoCAxgC5VehQ2tRNhSguw6GVKujnX3GOpLYlDnjftx-F6hLzJ_h4-b6IJcpj_iAy47NSu0KpuH1hnyfzlP0vSESEfzbVRcKYmppXJpXg1MW0wlsjzpXjmiJ1xRMTN-3AUplMXixTmIGTEe0-DbdYcXQWC5wEchLniEbmoyz-y453qPuizzDvzcQ0G5bk_EqikoXv_OwApYWyuemww1k4VBufIjfe1uog",
...
...
}
```
Invoke the API:
```sh
curl -X GET -H 'Authorization: Bearer <your_JWT>' http://localhost:8000/member/api/v1/members
```
The response should be like:
```json
{
    "members": [
        {
            "name": "dino",
            "place": "jakarta"
        },
        {
            "name": "doni",
            "place": "bandung"
        }
    ]
}
```
If the JWT is expired, it'll response:
```json
{
  "exp": "token expired"
}
```
If the JWT is invalid, it'll response:
```json
{
  "message": "Bad token; invalid signature"
}
```

### 5. Inspecting Upstream Service Log
Below is log of request headers when Kong JWT Plugin unapplied.
```text
headers {
  host: '172.17.0.1:3000',
  connection: 'keep-alive',
  'x-forwarded-for': '172.17.0.1',
  'x-forwarded-proto': 'http',
  'x-forwarded-host': 'localhost',
  'x-forwarded-port': '8000',
  'x-forwarded-path': '/member/api/v1/members',
  'x-forwarded-prefix': '/member',
  'x-real-ip': '172.17.0.1',
  'user-agent': 'curl/7.81.0',
  accept: '*/*'
}
```

Below is log of request headers after Kong JWT Plugin applied. 
```text
headers {
  host: '172.17.0.1:3000',
  connection: 'keep-alive',
  'x-forwarded-for': '172.17.0.1',
  'x-forwarded-proto': 'http',
  'x-forwarded-host': 'localhost',
  'x-forwarded-port': '8000',
  'x-forwarded-path': '/member/api/v1/members',
  'x-forwarded-prefix': '/member',
  'x-real-ip': '172.17.0.1',
  authorization: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ1cXprRG1GbTFuVFV6X0YwazRjNGRRcVU4VzM2RF9qTnFhZDJGbERWQjJVIn0.eyJleHAiOjE2NzUxMzU1NjYsImlhdCI6MTY3NTEzNTI2NiwianRpIjoiMWZhODdkNWQtNzEwOS00YjBiLWFkNWYtMjlhMGY3OWNmNGNhIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDo4MDgwL3JlYWxtcy9mb28tcmVhbG0iLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiZmZlMTVjNzktMjFkMS00ODRjLTk0OTMtZmIzN2NlYTNkNDY1IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiZm9vLWNsaWVudCIsInNlc3Npb25fc3RhdGUiOiI3MDljYTZmZi0zODgyLTQwYTgtYmNhMy03MGFhMmYyMTE3OGEiLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtZm9vLXJlYWxtIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoicHJvZmlsZSBlbWFpbCIsInNpZCI6IjcwOWNhNmZmLTM4ODItNDBhOC1iY2EzLTcwYWEyZjIxMTc4YSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwicHJlZmVycmVkX3VzZXJuYW1lIjoiZm9vLXVzZXIiLCJnaXZlbl9uYW1lIjoiIiwiZmFtaWx5X25hbWUiOiIifQ.odanSqmExCwZwiG3OfGnM6ewJg3S9mMght6itj7lrgwHbOHNdamB3L8-pkjXwDp4VCHHq-hMzAK_88RUMlARf6TuJR6zfuCdEhiLDgOCEMCD2Rgh9pky9XJLUy8uaACqerOhh5xhsmkFjb1LbPPihOMThEdiW0SF076K8LZEYZuj0XnBFouB5T5qZ9GIqVwQQExPE3Hy4lGqZ8Ewgzww3dWWyKm8ztMEELV9qz1mXIbiovcjjtm1GJXnr9mXSKDzy0oYeD_Sg79sHOJvhYqmqQgj6AqWOvFC9mZVsTV5QRa559sUI00IVzfHWdEY9oGdsSfl5OdTxgZNAmJFDoahMQ',
  'user-agent': 'PostmanRuntime/7.29.2',
  accept: '*/*',
  'postman-token': '904e7c46-b984-4ff9-acc7-df0c63083441',
  'accept-encoding': 'gzip, deflate, br',
  'x-consumer-id': '26943a9a-c78a-576e-a0fb-9b10171afc09',
  'x-consumer-username': 'the_users',
  'x-credential-identifier': 'http://localhost:8080/realms/foo-realm'
}
```

## Destroy Kong Gateway Container
If you’re done testing Kong Gateway and no longer need the containers, you can clean them up using the following commands:
```sh
docker stop kong-dbless && docker container rm kong-dbless
```