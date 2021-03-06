# QUASI-Express

[![Known Vulnerabilities](https://snyk.io/test/github/markonyango/quasi-express/badge.svg?style=flat-square)](https://snyk.io/test/github/markonyango/quasi-express) [![Build Status](https://travis-ci.org/markonyango/quasi-express.svg?branch=master)](https://travis-ci.org/markonyango/quasi-express)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for your own purposes.

### Prerequisites

+ NodeJS
+ MongoDB

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

MongoDB is needed as the backend part. You can find a detailed installation instruction here: [Link](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

### Installing

Download the repository to your local machine and change to the new folder. Once inside the new folder, trigger the installation of all required npm dependencies

```bash
git clone https://github.com/markonyango/quasi-express.git
cd quasi-express
npm install
```
Next install the quasi-tools library for full functionality. It's available here: [Link](http://www.github.com/markonyango/quasi-tools)
```bash
git clone https://github.com/markonyango/quasi-tools.git
sh ./quasi-tools/install.sh
```

The server can be started by simply running either of the following commands

```bash
npm start
./bin/www
```

the difference being that the first starts the server with *nodemon* which will catch app crashes and restart the server, while the latter starts the server instance directly.

With the default setup, the server will be reachable [localhost:3000](http://localhost:3000). Every other PC in your network will also be able to access the server as long as your PCs network/firewall settings allow it. This is usefull if you are thinking of setting up the server to be used by multiple people (e.g. co-workers in your group or even faculty/company-wide).

## Configuring the server

Once the server was successfully downloaded, make sure to set the neccessary server variables in settings.js:

```javascript
module.exports = {
  uploadPath: 'path/where/userfiles/will/be/stored',
  mongodDB: 'url to your mongodb installation (e.g. 127.0.0.1)',
  alignReferenceFolder: 'path/to/your/bowtie/reference/files'
}
```

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
