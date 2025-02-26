# validate-npm-package-name-cli <sup>[![Version Badge][npm-version-svg]][package-url]</sup>

[![github actions][actions-image]][actions-url]
[![coverage][codecov-image]][codecov-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

[![npm badge][npm-badge-png]][package-url]

CLI for https://npmjs.com/validate-npm-package-name - give me a string and I'll tell you if it's a valid npm package name.

## Usage

```sh
npx validate-npm-package-name-cli npm # if not installed

validate-npm-package-name-cli npm # if installed and in the PATH
```

```sh
$ validate-npm-package-name-cli --help
Usage:
validate-npm-package-name-cli <npm package specifier>
```

## Install

```
npm install --save-dev validate-npm-package-name-cli
```

## License

MIT

[package-url]: https://npmjs.org/package/validate-npm-package-name-cli
[npm-version-svg]: https://versionbadg.es/ljharb/validate-npm-package-name-cli.svg
[deps-svg]: https://david-dm.org/ljharb/validate-npm-package-name-cli.svg
[deps-url]: https://david-dm.org/ljharb/validate-npm-package-name-cli
[dev-deps-svg]: https://david-dm.org/ljharb/validate-npm-package-name-cli/dev-status.svg
[dev-deps-url]: https://david-dm.org/ljharb/validate-npm-package-name-cli#info=devDependencies
[npm-badge-png]: https://nodei.co/npm/validate-npm-package-name-cli.png?downloads=true&stars=true
[license-image]: https://img.shields.io/npm/l/validate-npm-package-name-cli.svg
[license-url]: LICENSE
[downloads-image]: https://img.shields.io/npm/dm/validate-npm-package-name-cli.svg
[downloads-url]: https://npm-stat.com/charts.html?package=validate-npm-package-name-cli
[codecov-image]: https://codecov.io/gh/ljharb/validate-npm-package-name-cli/branch/main/graphs/badge.svg
[codecov-url]: https://app.codecov.io/gh/ljharb/validate-npm-package-name-cli/
[actions-image]: https://img.shields.io/endpoint?url=https://github-actions-badge-u3jn4tfpocch.runkit.sh/ljharb/validate-npm-package-name-cli
[actions-url]: https://github.com/ljharb/validate-npm-package-name-cli/actions
