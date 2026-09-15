# Code Conventions

## Components

* Use default exports for React components.
* Import components directly from their own files.

## Utilities and Constants

* Use named exports for utility functions and constants.

## Import Renaming

* Do not rename imports by default. Rename a named import only when needed to avoid a naming conflict or to make the purpose clearer.

## Component Naming

* React component files use PascalCase, such as `BookCard.jsx` and `FilterChip.jsx`.
* The component name must match the file name.
* Simple components stay as a single file; a component gets its own folder only when it has related CSS, helpers, or other supporting files.
* Component-specific CSS and helpers should be kept in the component's folder when that folder exists.
