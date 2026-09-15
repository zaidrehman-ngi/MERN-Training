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

Exercise 2 - PART A - Task 1
A caret (^) allows updates within the same major version. A tilde (~) allows patch updates within the same minor version. A bare (*) allows almost any version.


Exercise 2 - PART A - Task 2

| Range   | 4.18.5 | 4.19.0 | 5.0.0 |
| ------- | ------ | ------ | ----- |
| ^4.18.2 | Yes    | Yes    | No    |
| ~4.18.2 | Yes    | No     | No    |
| 4.18.2  | No     | No     | No    |

MAJOR is the version number that can introduce breaking changes.


Exercise 2 - PART A - Task 3
The exact Express version installed is 5.2.1.

package.json lists the dependencies and the version ranges that the project accepts. package-lock.json records the exact versions that were installed, including the dependency tree. This helps ensure that the same versions are installed on different machines.


Exercise 2 - PART A - Task 4
After deleting node_modules and package-lock.json and running npm install, Express 5.2.1 was installed.

Two people can get different versions because package.json contains a version range such as ^5.2.1, not one exact version. If a newer compatible version is released after one person installs the project, another person running npm install later may get that newer version when there is no package-lock.json.


Exercise 2 - PART A - Task 5
npm install installs the dependencies from package.json and can update package-lock.json when needed.

npm ci installs the exact versions recorded in package-lock.json and does not update the lockfile. It also requires package.json and package-lock.json to be in sync; otherwise, it fails.

npm ci is better for deployment pipelines because it provides a clean and predictable installation using the exact locked versions.


Exercise 2 - PART B - Task 6
Lodash 4.17.11 has a critical severity vulnerability. The report includes command injection, prototype pollution, ReDoS, and code injection issues. The command injection and code injection issues can potentially allow an attacker to execute unintended commands or code when the vulnerable functionality is used. The audit report says a fix is available through npm audit fix.


Exercise 2 - PART B - Task 7
npm audit fix updated lodash from 4.17.11 to 4.18.1. The package.json dependency remained ^4.17.11, while package-lock.json was updated to record the new exact version. Running npm audit again showed 0 vulnerabilities.

npm audit fix --force can apply breaking or major-version changes, so I would not use it casually because it could fix the vulnerability while also breaking the application.


Exercise 2 - PART B - Task 8
A high-severity vulnerability in a production dependency is generally more serious because it can directly affect the live application. A vulnerability in a devDependency may have less direct risk because it is mainly used during development. However, devDependencies should not be ignored because they can still affect developers' machines, build systems, or CI environments. High-severity vulnerabilities in devDependencies should also be reviewed and fixed when possible.


Exercise 2 - PART B - Task 9
We found one critical security issue in the Lodash package we were using. We updated Lodash to a newer version that fixes the reported issue and confirmed that the project now has no known vulnerabilities. We also reviewed the other audit findings and found no remaining issues. At this time, there are no outstanding security issues from the audit.

================================================================================================================

Exercise 3 - Task 1
Added a start script to run the app with Node and a dev script to run it with Nodemon. Tested both scripts successfully.


Exercise 3 - Task 2
npm run dev works because nodemon is installed locally in the project's node_modules folder as a devDependency. npm automatically looks in node_modules/.bin when running scripts, so it can find and run nodemon without a global installation.


Exercise 3 - Task 3
npm start works without run because start is a built-in npm script that npm treats specially. The start and test scripts are handled differently from custom scripts, so start can be run using npm start, while a custom script such as dev requires npm run dev.


Exercise 3 - Task 4
The clean script removes the node_modules folder, while the reset script first runs clean and then reinstalls the dependencies. The commands are chained with && so the second command only runs if the first command completes successfully. With a single &, the next command can run even if the previous command fails.


Exercise 3 - Task 5
The greet script takes a command-line argument using process.argv. The -- is used by npm to indicate that the following values should be passed to the script as arguments. In this case, npm run greet Zaid also works because npm passes Zaid to the script, but -- makes the intention explicit and is useful when passing arguments that could otherwise be interpreted as npm options.


Exercise 3 - Task 6
prestart runs automatically before start, and poststart runs automatically after it. A useful pretest hook could run checks such as linting or validating the test environment before the tests start.

================================================================================================================

Exercise 4 - PART A - Task 1
The current Node.js version is v24.20.0. I created a .nvmrc file containing v24.20.0. NVM for Windows did not read the .nvmrc automatically with nvm use, so I used nvm use 24.20.0 to switch to the required version.


Exercise 4 - PART A - Task 2
The .nvmrc file tells NVM which Node.js version to use for the project, while the engines field declares the Node.js version required by the project. In short, .nvmrc is used to select the version, while engines defines the project’s Node.js requirement.


Exercise 4 - PART B - Task 4
format rewrites the files, while format:check only checks whether the files are formatted correctly. format:check belongs in a CI pipeline because it checks formatting without modifying the code and fails if formatting is incorrect.


Exercise 4 - PART C - Task 5
The config file created was eslint.config.mjs, not .eslintrc. Older tutorials use the legacy .eslintrc format, while newer ESLint versions use the flat config format with eslint.config.js or eslint.config.mjs.


Exercise 4 - PART C - Task 6
The author probably meant if (x === 10), which checks whether x is equal to 10. Instead, x = 10 assigns 10 to x. The assignment expression evaluates to 10, which is truthy, so the condition becomes true and console.log('hi') runs.


Exercise 4 - PART C - Task 8
eslint-config-prettier disables ESLint rules that may conflict with Prettier's formatting rules. The check script runs the linter first and then the formatting check using &&, so it fails if either check fails. This makes npm run check a single command to run before pushing.