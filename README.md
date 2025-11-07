# patricktree OSS <!-- omit in toc -->

- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Build \& Run](#build--run)
  - [Additional commands for development](#additional-commands-for-development)
- [Updating TypeScript](#updating-typescript)

## Development

For detailed information about the repository structure, conventions, and development practices, see [CLAUDE.md](./CLAUDE.md).

### Prerequisites

- **Node.js:** It is recommended to use [nvm](https://github.com/nvm-sh/nvm) and run `nvm use`, this will automatically switch to the Node.js version mentioned in the file [`.nvmrc`](./.nvmrc).  
   Alternatively you can install Node.js directly, please refer to `.nvmrc` of this project to determine the Node.js version to use.
- **pnpm:** This monorepo ("workspace") uses [`pnpm`](https://pnpm.io/) as package manager.  
  It is recommended to use `corepack` of Node.js, just run:

  ```sh
  corepack enable
  ```

  `pnpm` commands should now be available (and the `pnpm` version specified in `package.json#packageManager` will be automatically used).

- **Toolchain for native Node.js modules:** Run the installation instructions "A C/C++ compiler tool chain for your platform" of [microsoft/vscode/wiki/How-to-Contribute#prerequisites](https://github.com/microsoft/vscode/wiki/How-to-Contribute#prerequisites).

### Build & Run

See [Common Commands in CLAUDE.md](./CLAUDE.md#common-commands) for build and development commands.

### Additional commands for development

See `scripts` of [`./package.json`](./package.json) for available scripts in the workspace.

## Updating TypeScript

See [TypeScript Patching in CLAUDE.md](./CLAUDE.md#typescript-patching) for detailed instructions on updating TypeScript with our custom transformer setup.
