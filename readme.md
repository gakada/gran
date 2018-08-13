Local raid finder and notifier for GBF.

* Find raids on Twitter
* Copy IDs into clipboard
* Play sound alerts
* Log in console
* ~~Post on Discord~~

# Usage

```sh
npm i -g gran
```

Configure Twitter [access keys](https://apps.twitter.com/) and raids in `gran.yaml` in current or home directory, see `gran.example.yaml` for config format.

Run:

```sh
gran
```

For an alternative config file:

```sh
gran -c path/to/config.yaml
```

Environment variables and command line arguments can be used to override the config:

```sh
$ copy=false gran 'GO = Lv100 ジ・オーダー・グランデ, Lvl 100 Grand Order' ...
```

# Todo

* Discord
* Auto join?
