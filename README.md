# Library Labeler

## Website
A deployed version of this web app can be found
[here](https://thomasebsmith.github.io/library-labeler/).

## Quick Start
You'll need NPM, Node.js, Git, and GNU Make.

The instructions below also use Python 3 to host the site.

```sh
$ git clone https://github.com/thomasebsmith/library-labeler.git
$ cd library-labeler
$ npm install
$ make build/release
# The static site now exists in ./build/release
$ python3 -m http.server 8000 ./build/release
# You can now visit http://localhost:8000 in your web browser
```
