# GraphQL Blog Microservice

Starter project using MongoDB, JSON Web Tokens and relationships in GraphQL.

# Setting up your development environment

1. Install the dependencies

```sh
yarn install
```

2. Setup the local infrastructure using Docker

```
docker-compose up -d
```

3. Start the app

```sh
yarn start
```

# Deploying to Heroku

Make sure you are logged in into your Heroku account

```sh
heroku login
```

Create a new app associated with the repository

```sh
heroku create
```

Push the Dockerfile to the Heroku Registry

```sh
heroku container:push web
```

Release your app

```sh
heroku container:release web
```

Check if everything looks fine

```sh
heroku open
```
