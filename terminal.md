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

Exercise 2 - PART A - Task 4

Commands:

rmdir /s /q node_modules
del package-lock.json
npm install
npm list express

Output:

library-api@1.0.0 D:\MERN-Training\library-api
└── express@5.2.1


Exercise 2 - PART B - Task 6

Command:

npm install lodash@4.17.11

Output:

added 1 package, and audited 159 packages in 2s

48 packages are looking for funding
run `npm fund` for details

1 critical severity vulnerability

Command:

npm audit

Output:

lodash <=4.17.23
Severity: critical

Command Injection in lodash
Prototype Pollution in lodash
Regular Expression Denial of Service (ReDoS) in lodash
Lodash vulnerable to Code Injection via _.template imports key names
Lodash vulnerable to Prototype Pollution via array path bypass in _.unset and _.omit
Lodash has Prototype Pollution Vulnerability in _.unset and _.omit functions

fix available via npm audit fix

node_modules/lodash

1 critical severity vulnerability


Exercise 2 - PART B - Task 7

Command:

npm audit fix

Output:

changed 1 package, and audited 159 packages in 3s

48 packages are looking for funding
run `npm fund` for details

found 0 vulnerabilities


Command:

npm audit

Output:

found 0 vulnerabilities

=================================================================================================================

Exercise 3 - Task 1

Command:

npm start

Output:

> library-api@1.0.0 start
> node index.js

Library API is running


Command:

npm run dev

Output:

> library-api@1.0.0 dev
> nodemon index.js

[nodemon] 3.1.14
[nodemon] starting `node index.js`
Library API is running
[nodemon] clean exit - waiting for changes before restart


Exercise 3 - Task 3

Command:

npm start

Output:

> library-api@1.0.0 start
> node index.js

Library API is running


Command:

npm dev

Output:

Unknown command: "dev"

Did you mean this?
  npm run dev # run the "dev" package script

To see a list of supported npm commands, run:
  npm help


Exercise 3 - Task 4

Command:

npm run clean

Output:

> library-api@1.0.0 clean
> rmdir /s /q node_modules


Command:

dir

Output:

Directory of D:\MERN-Training\library-api

09/01/2026  06:59 PM                18 .gitignore
09/01/2026  07:09 PM                38 index.js
09/02/2026  12:32 PM            71,506 package-lock.json
09/02/2026  01:35 PM               532 package.json


Command:

npm run reset

Output:

> library-api@1.0.0 reset
> npm run clean && npm install


> library-api@1.0.0 clean
> rmdir /s /q node_modules

The system cannot find the file specified.


Command:

npm run reset

Output:

> library-api@1.0.0 reset
> npm run clean && npm install


> library-api@1.0.0 clean
> if exist rmdir /s /q node_modules


added 158 packages, and audited 159 packages in 3s

48 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities


Exercise 3 - Task 5

Command:

npm run greet -- Zaid

Output:

> library-api@1.0.0 greet
> node index.js Zaid

Library API is running
Hello, Zaid!


Command:

npm run greet Zaid

Output:

> library-api@1.0.0 greet
> node index.js Zaid

Library API is running
Hello, Zaid!


Exercise 3 - Task 6

Command:

npm start

Output:

> library-api@1.0.0 prestart
> echo checking environment...

checking environment...

> library-api@1.0.0 start
> node index.js

Library API is running
Hello, undefined!

> library-api@1.0.0 poststart
> echo application started

application started

=================================================================================================================

