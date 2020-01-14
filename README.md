## Description
Semester project for my web development class.
The theme was of my choice and the expectation was to use the most basic Javascript knowledge. We were taught a proper folder structure for such projects as well as database implementations right after I submitted this project.
The theme for this project was a NodeJS website for a prison. The project was a bit too ambitious for its own good, so a lot of ideas had to be scrapped to fit into the deadline. Some pages still contain placeholder data.

## Disclaimer
The project was made with the Cloud9 hosting service and was never tested or even expected to work outside of that environment. The c9 metadata is therefore included to maintain accessability.
All npm packages were not included to save on space and improve sharability.

## Documentation
All routing is made via *express* and *express-handlebars*. All routes and services are defined under ./index.js .
For database interactions I use *lowdb*, which allows interpreting .json files as databases. As Cloud9 did not allow running separate processes for databases, a feature that would be needed for most no-sql databases, this method was the best one available for such a small scale project.