# QUASI-Express

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for your own purposes.

### Prerequisites

What things you need to install the software and how to install them.

#### Ubuntu Linux

First, make sure you have the neccessary tools for building software from GitHub installed (needed for compilation/building/etc). If not install them like this

```bash
sudo apt-get install -y build-essential git curl
```

Next, install _NodeJS_ itself and confirm the version you downloaded (e.g. v9.6.1)

```bash
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
```

### Installing

Download the repository to your local machine and change to the new folder. Once inside the new folder, trigger the installation of all required npm dependencies

```bash
git clone https://github.com/markonyango/quasi-express.git
cd quasi-express
npm install
```

The server can be started by simply running either of the following commands

```bash
npm start
./bin/www
```

the difference being that the first starts the server with *nodemon* which will catch app crashes and restart the server, while the latter starts the server instance directly.

With the default setup, the server will be reachable [localhost:3000](http://localhost:3000). Every other PC in your network will also be able to access the server as long as your PCs network/firewall settings allow it. This is usefull if you are thinking of setting up the server to be used by multiple people (e.g. co-workers in your group or even faculty/company-wide).

## Running the tests

To run the testsuite, spin up the server with

```bash
npm start
```

and visit [localhost:3000/test](http://localhost:3000/test) in your browser. Each test will run automatically and report its return status. The server will also provide useful information in the terminal window from which it was started. Detailed information pertaining potential errors during execution will show up there.

Make sure that you remove the following files once you are ready to publicly deploy the server (for obvious security reasons)

+ public/test (entire folder)
+ public/js/test.js
+ public/js/mocha.min.js
+ public/js/chai.min.js
+ views/test.hbs

These files are only used for testing purposes and can be remove safely after successful testing your installation.

## Authors

+ **Mark Onyango** - *Initial work* - [markonyango](https://github.com/markonyango)

## License

This project is licensed under the GPLv3 License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

+ Hat tip to anyone whose code was used
