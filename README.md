# Library Labeler
Library Labeler is a webapp for easily creating labels for your library items.
Currently, it supports generating a PDF that will print on Avery 5412 label
sheets. It also generates a companion sheet that tells you which item each label
corresponds to.

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
$ python3 -m http.server 8000 --directory ./build/release
# You can now visit http://localhost:8000 in your web browser
```

## License
Library Labeler is licensed as open-source software under the MIT License. See
[LICENSE](./LICENSE) for details.
