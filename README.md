# IN DEVELOPMENT!

# git-storage

A lightweight Node.js library that enables Git-based data storage by directly managing and committing data to Git repositories. It transforms Git remotes into simple, version-controlled databases, perfect for small websites and static projects.

## Features

- **Git as Database** - Transform any Git repository into a version-controlled database
- **Multiple Adapters** - Support for GitHub repositories (Bitbucket, GitLab, etc. coming soon)
- **TypeScript First** - Full TypeScript support with type-safe operations
- **CRUD Operations** - Create, read, update, delete, count, and exists operations
- **Automatic Commits** - Changes are automatically committed and pushed to remote
- **Records Storage** - Simple JSON-based data storage with ID-based records
- **Files Storage** - Simple file storage with commit messages

## Why use this

- **No database to host**: Data lives in your Git repository as JSON records and files with full version history.
- **Serverless-friendly**: Works great on platforms like Vercel, Netlify, or Cloudflare Pages—deploy static HTML and rebuild on each Git push.
- **Zero backend maintenance**: No long‑running servers. Changes are committed to Git and can trigger rebuilds via webhooks/CI.
- **Content-driven rebuilds**: Sites can regenerate based on updated Git records and files, keeping content in sync with the repo.
- **CMS-friendly editing**: Hook up lightweight CMS/admin UIs so non‑technical editors can update content themselves. Edits are committed to the repo, trigger rebuilds, require no separate database, and keep the repo as the single source of truth.

## Warning

This library should only be used for small websites and static projects. Race conditions and other issues may occur, as this project is only meant for small static projects that rarely need to perform CRUD operations.
