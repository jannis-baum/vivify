# Vivify

Vivify brings your files to life in the browser! Vivify is primarily made to
render Markdown and Jupyter Notebooks, but will also serve as a directory
browser and let you view code files with syntax highlighting. See below for
features!

## Features

- view Markdown with various [features](#markdown-features)
- view Jupyter Notebooks
- view other plain text files with code syntax highlighting
- view & navigate directories, hidden "back to parent directory" button at the
  top-left of the file viewer
- easy to integrate with any editor for live synchronization (see [editor
  support](#editor-support))
- Vivify server starts lazily and automatically shuts down when no more viewers
  are connected
- various [customization options](docs/customization.md)
  
If you need any additional features, feel free to [open an
issue](https://github.com/jannis-baum/vivify/issues/new/choose) or
[contribute](CONTRIBUTING.md)!

### Markdown features

- full [basic](https://www.markdownguide.org/basic-syntax/) and
  [extended](https://www.markdownguide.org/extended-syntax/) syntax support
- [KaTeX math](https://katex.org)
- [graphviz/dot graphs](https://graphviz.org/doc/info/lang.html)
- [GitHub alert
  blocks](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts)
- links to other files: [relative links like in
  GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#relative-links)
  as well as absolute file links
- [add styles, classes, ids or other attributes directly from
  Markdown](https://github.com/arve0/markdown-it-attrs?tab=readme-ov-file#examples)
- table of contents with `[[toc]]`
- `<kbd>` tags, e.g. to style keyboard shortcuts

You can find examples for all supported features in the files in the
[`tests/rendering`](tests/rendering) directory. In case you are looking at these
on GitHub, keep in mind that GitHub doesn't support some of the features that
Vivify supports so some things may look off.

### Editor Support

Vivify has a simple API to integrate your favorite editor so the viewer live
updates to any changes as you are typing and the scrolling is smoothly
synchronized!

See below for a list of existing editor plugins. In case your favorite editor is
not yet supported, use these as an example to write your own or check out the
[API documentation](docs/api.md) and add it to the list!

#### Existing integration

- for Vim and Neovim: [vivify.vim](https://github.com/jannis-baum/vivify.vim)

## Installation

Once you have Vivify installed, use it by running `viv` with any text file or
directory as an argument! See below for installation options.

### Packaged

- [Homebrew](https://brew.sh): `brew install jannis-baum/tap/vivify`
- [AUR](https://aur.archlinux.org/packages/vivify): e.g. `yay -S vivify`

### Manual

- download & unpack the [latest
  release](https://github.com/jannis-baum/vivify/releases) for your system
  (macOS or Linux)
- add the two executables to your `$PATH`

### Compile yourself

- make sure you have [`yarn`](https://yarnpkg.com), `make` and `zip` installed
- clone the repository
- run `yarn`
- run `./configure <install_dir>`
- run `make install`

> [!TIP]  
> If you are having trouble building Vivify, or you'd like more detailed build
> instructions, see our [CONTRIBUTING](docs/CONTRIBUTING.md) page

## Get help

Is something not working or do you have any questions? [Start a
discussion!](https://github.com/jannis-baum/vivify/discussions/new?category=q-a)

## Acknowledgments

I have been using
[iamcco/markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim)
for the longest time and started this project because

1. I wanted a Markdown viewer that works with and without Vim and
2. I wanted a Markdown viewer that supports file links like in GitHub.

Looking at
[iamcco/markdown-preview.nvim](https://github.com/iamcco/markdown-preview.nvim)
helped in development, particularly with regard to which `npm` packages to use.
