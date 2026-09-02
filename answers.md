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

