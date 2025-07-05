# IN DEVELOPMENT!

# git-storage

A lightweight Node.js library that enables Git-based data storage by directly managing and committing data to Git repositories. It transforms Git remotes into simple, version-controlled databases, perfect for small websites and static projects.

## Features

- **Git as Database** - Transform any Git repository into a version-controlled database
- **Multiple Adapters** - Support for GitHub repositories (Bitbucket, GitLab, etc. coming soon)
- **TypeScript First** - Full TypeScript support with type-safe operations
- **CRUD Operations** - Create, read, update, delete, count, and exists operations
- **Automatic Commits** - Changes are automatically committed and pushed to remote
- **JSON Storage** - Simple JSON-based data storage with ID-based records

## Warning

This library should only be used for small websites and static projects. Race conditions and other issues may occur, as this project is only meant for small static projects that rarely need to perform CRUD operations.
