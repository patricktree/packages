---
name: browser-tools
description: A standalone Chrome helper. It launches/inspects DevTools-enabled Chrome profiles, pastes prompts, captures screenshots, and kills stray helper processes.
---

# browser-tools

## Description

A standalone Chrome helper inspired by Mario Zechner’s [“What if you don’t need MCP?”](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/) article. It launches/inspects DevTools-enabled Chrome profiles, pastes prompts, captures screenshots, and kills stray helper processes without needing the full Oracle CLI.

## Usage

`./bin/browser-tools-cli.js`

Common commands include `start --profile`, `nav <url>`, `eval '<js>'`, `screenshot`, `search --content "<query>"`, `content <url>`, `inspect`, and `kill --all --force`
