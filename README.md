# Bookstore API

'You are tasked with creating a RESTful API to manage a simple bookstore...' This is the implementation of a simple RESTful API for managing books using **Node.js**, **Express**, **SQLite**, and **Jest**. Supports full CRUD operations.

---

## Features

-  CRUD API support
-  SQLite database for persistence
-  Documented routes and helper functions
-  Fully tested with Jest + Supertest
-  Code coverage implemented

---

### Installation
npm install
 
### Running the App
npm start
-  The server will start at: http://localhost:3000

### Running Tests
npm test

### Running Code Coverage
npm run coverage

### Data Persistance
File storage and in-memory are implemented. Currently, in-memory is enabled. Please see line 5 in database.js for more information

### Technologies
-  Node.js 
-  Express
-  SQLite3
-  Jest + Supertest

### Project Structure
```
bare_interview/
├── database.js
├── .gitignore
├── index.js
├── index.test.js
├── lib.js
├── package.json
└── README.md
```
### Future Improvements
    - Add Swagger documentation
    - Add CI/CD solution
