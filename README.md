# gameface-api

An API server that handles in-game services.


# Prerequisites

Install PostgreSQL via [homebrew](http://brew.sh/):

    brew install postgresql
    ln -sfv /usr/local/opt/postgresql/*.plist ~/Library/LaunchAgents
    launchctl load ~/Library/LaunchAgents/homebrew.mxcl.postgresql.plist
    initdb /usr/local/var/postgres

If you run into problems initalising the database, you may need to do this:

    rm -rf /usr/local/var/postgres


# Installation

Initialise settings:

    cp settings_local.js.dist settings_local.js.dist

# Development

Run the development server:

    node app.js

To have the server restart upon changes, use [nodemon](https://github.com/remy/nodemon):

    nodemon app.js

Poke around the database:

    psql arewefast

View the database tables:

    \dt
