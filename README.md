# OpenRCT2 Prometheus Exporter

An OpenRCT2 plugin that exports Prometheus metrics for a (limited but growing) set of park metrics.

## Installation

This plugin requires the in-development [networking API](https://github.com/OpenRCT2/OpenRCT2/pull/12712). It has been tested against
commit 66fb9f556e1ff6b7e52776083303d17b98721ebf.

Download [index.js](./index.js) from GitHub and save the file into your OpenRCT2 plugin folder. This location can be found
according to the [OpenRCT2 scripting](https://github.com/OpenRCT2/OpenRCT2/blob/e9803fc4b51d80fdeabf5fdb57469ff6fc753db3/distribution/scripting.md#scripts-for-openrct2) documentation.

## Usage

The plugin runs in the background, listening for scripts at the address "localhost:9751", which is currently hardcoded into the file, but may be configurable soon.
