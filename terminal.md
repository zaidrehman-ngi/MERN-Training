Exercise 1 - Task 1

Command:
npm init

Output:
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.

Command:
npm init

Output:
This utility will walk you through creating a package.json file.

package name: (library-api)
version: (1.0.0)
description:
entry point: (index.js)
test command:
git repository:
keywords:
author:
license: (ISC)
type: (commonjs)

About to write to D:\MERN-Training\library-api\package.json

Is this OK? (yes)


Exercise 1 - Task 2

Command:
npm install express dotenv

Output:
added 69 packages, and audited 70 packages in 10s

28 packages are looking for funding
run `npm fund` for details

found 0 vulnerabilities


Command:
npm install --save-dev nodemon eslint

Output:
added 88 packages, and audited 158 packages in 25s

48 packages are looking for funding
run `npm fund` for details

found 0 vulnerabilities

Result:
express and dotenv were added to dependencies.
nodemon and eslint were added to devDependencies.


Exercise 1 - Task 4

Command:
rmdir /s /q node_modules

Command:
dir

Output:
package-lock.json
package.json

node_modules was successfully deleted.


Command:
npm install

Output:
added 157 packages, and audited 158 packages in 4s

48 packages are looking for funding
run `npm fund` for details

found 0 vulnerabilities

node_modules was recreated successfully.


Created .gitignore with:
node_modules
.env

Command:
git status

Output:
On branch week1-day2
Changes not staged for commit:
    modified:   answers.md
    modified:   terminal.md

Untracked files:
    library-api/

node_modules and .env do not appear in git status.


Exercise 1 - Task 5

Command:
node .

Output:
Error: Cannot find module 'D:\MERN-Training'

Node.js v24.20.0


Command:
cd library-api
node .

Output:
Library API is running

=================================================================================================================

