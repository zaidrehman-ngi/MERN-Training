Exercise 1 - Task 1
package.json fields:

name — The name of the project.
version — The current version of the project.
description — A short description of the project.
license — The license used by the project.
author — The person who created the project.
type — Defines the module system used by Node.js.
main — The main entry point of the project.
scripts — Commands that can be run using npm.


Exercise 1 - Task 2
Express and dotenv are in dependencies because they are needed when the app runs. Nodemon and ESLint are in devDependencies because they are only needed during development.
No surprises.


Exercise 1 - Task 3
peerDependencies — Packages that your package expects the project using it to provide.
optionalDependencies — Packages that can be installed if available but are not required for the package to work.


Exercise 1 - Task 4
node_modules contains the packages installed for the project. It is not committed because it can be recreated by running npm install. The .gitignore excludes node_modules and .env, and neither appears separately in git status.


Exercise 1 - Task 5
The main field specifies the entry point of a package. If it is missing, Node uses index.js as the default entry point.

=================================================================================================================

