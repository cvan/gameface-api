# gameface-api

An API server that handles in-game services.

This is consumed by the front-end interface for
[cvan/gameface-api](https://github.com/cvan/gameface-api).


# Installation

## Mac OS X

```bash
# Install redis via homebrew
brew install redis
# Set up redis as a launch agent
brew info redis
# Install node dependencies
npm install
# Copy local configuration into place
cp settings_local.js.dist settings_local.js
```

If you'd like to run the server for development, consider install [`nodemon`](http://nodemon.io/) instead:

```bash
npm install nodemon -g
```

# Development

Run the development server:

    node app.js

Or to have the server restart upon changes, using [nodemon](https://github.com/remy/nodemon):

    nodemon app.js

To play with redis:

    redis-cli

To watch the commands getting sent to redis:

    redis-cli monitor

To clear redis:

    redis-cli flushall
