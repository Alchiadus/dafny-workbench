# dafny-workbench

Dafny Workbench provides users with an environment in which they can easily write and verify [Dafny](https://www.microsoft.com/en-us/research/project/dafny-a-language-and-program-verifier-for-functional-correctness/) programs.

## Installation

Atom → File → Settings → Install → `dafny-workbench`, or:

```sh
$ apm install dafny-workbench
```

### Additional Steps

#### Required

- Install [Dafny](https://github.com/Microsoft/dafny/wiki/INSTALL) and verify it runs from the command line.
- Install the [language-dafny](https://atom.io/packages/language-dafny) package.

Note:
  - On non-Windows operating systems `pkill` is used to terminate Dafny and its descendants (e.g. Z3), make sure it can be resolved against the `PATH` variable.

#### Recommended

- Install the [linter](https://atom.io/packages/linter) package.

## Configuration

By default, the Dafny executable is resolved against the `PATH` variable. If the location of the tool's binary is added to the path, there's no need to change its `dafnyExecutablePath` setting.

Additionally, one may change the `dafnyExecutableArguments` (options) passed to Dafny. By default, the first line (banner) is excluded and compilation is turned off.

It is possible to change these settings in the Settings View:

Atom → File → Settings → Packages → `dafny-workbench`.

Alternatively, change them via Atom's `config.json`, for example:

```coffeescript
"dafny-workbench":
  executableSettings:
    # The location of the Dafny binary. By default it is resolved against the PATH variable.
    dafnyExecutablePath: "/path/to/dafny"
    # Comma separated list of options to pass to the Dafny binary. Execute `dafny /help` in your terminal to see which options are allowed.
    dafnyExecutableArguments: [
      "/nologo"
      "/compile:0"
    ]
```

## Commands and Keybindings

The following commands are available via the Command Palette if a Dafny file is open in the active editor:
- `dafny-workbench:start-dafny`
- `dafny-workbench:stop-dafny`

By default, no keybindings are setup. They can be added to your `keymap.cson`, for example:

```cson
'atom-text-editor[data-grammar~="source"][data-grammar~="dafny"]':
  'ctrl-shift-B': 'dafny-workbench:start-dafny'
  'ctrl-shift-alt-B': 'dafny-workbench:stop-dafny'
```

## Usage

When you open a file that is associated with the language grammar of the desired verification tool (e.g. `.dfy` for `language-dafny`), the verification tool will be run on the editor's content. Since the verification tools do not accept input from `stdin`, the package writes a copy of the file buffer to the OS's temporary folder each time a change is made to provide continuous verification, without the need to save a file.

## FAQ

**Q:** _I am having trouble getting Dafny to run. What should I do?_

**A:** A few tips:
  - Make sure that Dafny executes properly when you run it directly from the command line. See also: https://github.com/Microsoft/dafny/wiki/INSTALL.
  - Make sure that `dafnyExecutablePath` points directly (and only) to the Dafny executable, so no wrapper script and no options (define those in `dafnyExecutableArguments`).
  - If you are on a Unix system and have to use a wrapper script, make sure the `dafny-workbench` package can pass the options, as well as the file path to the script. The following example has been confirmed to work on a Mac (note the absence of quotes around `$*`, this is important):

  ```sh
  #!/usr/bin/env bash
  mono /path/to/Dafny.exe $*
  ```
