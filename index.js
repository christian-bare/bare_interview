// === FILE: index.js ===
const express = require('express');
const {getDb, initializeDb} = require('./database');
const {inputValidationId, inputValidationBody} = require('./lib');
const app = express();

app.use(express.json());

/**
 * GET /books
 * Get all books that exist within the 'books' table
 * 
 * @response 200 - OK, returns all books
 * @returns {Array<Object>} An array of book objects
 * - {number} id - the unique identifier for each entry
 * - {string} title - the title of the book
 * - {string} author - the author of the books
 * - {number} price - the price of the book
 * - {string} genre - the genre of the books
 * 
 * @response 500 - Internal server error - DB failure
 * @returns {Object} A object that current only contains the error message.
 * - {string} error - the error received from the backend
 */
app.get('/books', (req, res) => {
  // Declare the DB
  const db = getDb();

  // Structure the DB query and execute
  const sqlStatement = 'SELECT * FROM books';
  db.all(sqlStatement, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({error: err.message});
    } else {
      return res.json(rows);
    }
  });
});

/**
 * GET /books/:id
 * Get a single book from the 'books' table by its ID
 * 
 * @param {number} :id - the id of the entry to be retrieved
 * 
 * @response 200 - OK, returns book with specified ID
 * @returns {Object} The object that holds the data of the entry
 * - {number} id - the unique identifier for each entry
 * - {string} title - the title of the book
 * - {string} author - the author of the books
 * - {number} price - the price of the book
 * - {string} genre - the genre of the books
 * 
 * @response 400 - Input validation failure
 * @returns {Object} A object that current only contains the error message.
 * - {Array<string>} errors - the input validation errors
 * 
 * @response 404 - Book with specified ID not found
 * @returns {Object} A object that current only contains the error message.
 * - {string} message - a message stating that the entry cannot be found
 * 
 * @response 500 - Internal server error - DB failure
 * @returns {Object} A object that current only contains the error message.
 * - {string} error - the error received from the backend
 */
app.get('/books/:id', (req, res) => {
  // Declare the DB
  const db = getDb();

  // Input validation
  const id = req.params.id;
  const inputErrors = inputValidationId(id);
  if (inputErrors.length > 0) {
    return res.status(400).json({errors: inputErrors})
  }

  // Structure DB call and execute
  const sqlStatement = 'SELECT * FROM books WHERE id = ?'
  db.get(sqlStatement, [id], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({error: err.message});
    } else if (!rows) {
      return res.status(404).json({message: `Book with ID: ${id} not found`});
    } 
    return res.json(rows);
  });
});

/**
 * POST /books
 * Creates a new book that is entered into the DB
 * 
 * @body {string} title - the title of the book (required)
 * @body {string} author - the author of the books (required)
 * @body {number} price - the price of the book
 * @body {string} genre - the genre of the books
 * 
 * @response 201 - Created, the entry is created
 * @returns {Object} An object holding the confirmation information
 * - {string} message - a confirmation message
 * - {number} id - the newly created unique identifier for the new entry
 * 
 * @response 400 - Input validation failure
 * @returns {Object} A object that current only contains the error message.
 * - {Array<string>} errors - the input validation errors
 * 
 * @response 500 - Internal server error - DB failure
 * @returns {Object} A object that current only contains the error message.
 * - {string} error - the error received from the backend
 */
app.post('/books', (req, res) => {
  // Declare the DB
  const db = getDb();

  // Input validation
  const {title, author, price, genre} = req.body;
  const inputErrors = inputValidationBody(req.body);
  if (inputErrors.length > 0) {
    return res.status(400).json({errors: inputErrors})
  }

  // Structure DB call and execute
  const sqlStatement = `INSERT INTO books (title, author, price, genre) VALUES (?, ?, ?, ?);`;
  db.run(sqlStatement, [title, author, price ?? null, genre ?? null], function(err) { // price and genre are not required and, therefore, can be null, if not specified
    if (err) {
      console.error(err.message);
      return res.status(500).json({error: err.message});
    }
    return res.status(201).json({message: 'Book added successfully', id: this.lastID});
  })
});

/**
 * PUT /books/:id
 * Update an existing book by ID; all data within the entry will be updated
 * 
 * @param {number} :id - the id of the entry to be updated
 * 
 * @body {string} title - the new title of the book (required)
 * @body {string} author - the new author of the books (required)
 * @body {number} price - the new price of the book
 * @body {string} genre - the new genre of the books
 * 
 * @response 201 - Created, the entry is updated
 * @returns {Object} An object holding the confirmation information
 * - {string} message - a confirmation message
 * - {number} id - the unique identifier for the updated entry
 * 
 * @response 400 - Input validation failure
 * @returns {Object} A object that current only contains the error message.
 * - {Array<string>} errors - the input validation errors
 * 
 * @response 404 - Book with specified ID not found
 * @returns {Object} A object that current only contains the error message.
 * - {string} message - a message stating that the entry cannot be found
 * 
 * @response 500 - Internal server error - DB failure
 * @returns {Object} A object that current only contains the error message.
 * - {string} error - the error received from the backend
 */
app.put('/books/:id', (req, res) => {
  // Declare the DB
  const db = getDb();

  // Input validation
  const id = req.params.id;
  const {title, author, price, genre} = req.body;
  const inputErrorsID = inputValidationId(id);
  const inputErrorsBody = inputValidationBody(req.body);
  const inputErrors = inputErrorsID.concat(inputErrorsBody);
  if (inputErrors.length > 0) {
    return res.status(400).json({errors: inputErrors});
  }

  // Structure DB call and execute
  const updateStatement = `UPDATE books SET title = ?, author = ?, price = ?, genre = ? WHERE id = ?;`;
  db.run(updateStatement, [title, author, price ?? null, genre ?? null, id], function(err) { // price and genre are not required and, therefore, can be null, if not specified
    if (err) {
      console.error(err.message);
      return res.status(500).json({error: err.message});
    } else if (this.changes === 0) {
      return res.status(404).json({message: `Book with ID: ${id} not found`});
    }
    return res.status(201).json({message: 'Book updated successfully', id: id});
  })
});

/**
 * DELETE /books/:id
 * Deletes an existing book from the DB by ID
 * 
 * @param {number} :id - the id of the entry to be deleted
 * 
 * 
 * @response 200 - OK, the entry is deleted
 * @returns {Object} An object holding the confirmation information
 * - {string} message - a confirmation message
 * - {number} id - the unique identifier for the deleted entry
 * 
 * @response 400 - Input validation failure
 * @returns {Object} A object that current only contains the error message.
 * - {Array<string>} errors - the input validation errors
 * 
 * @response 404 - Book with specified ID not found
 * @returns {Object} A object that current only contains the error message.
 * - {string} message - a message stating that the entry cannot be found
 * 
 * @response 500 - Internal server error - DB failure
 * @returns {Object} A object that current only contains the error message.
 * - {string} error - the error received from the backend
 */
app.delete('/books/:id', (req, res) => {
  // Declare the DB
  const db = getDb();

  // Input validation
  const id = req.params.id;
  const inputErrors = inputValidationId(id);
  if (inputErrors.length > 0) {
    return res.status(400).json({errors: inputErrors})
  }

  // Structure DB call and execute
  db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({error: err.message});
    } else if (this.changes === 0) {
      return res.status(404).json({message: `Book with ID: ${id} not found`});
    } 
    return res.status(200).json({message: 'Book successfully deleted', id: id});
  });
});

if (require.main === module){
  // Async call to ensure that the DB is initialized before the app begins listening
  initializeDb().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Listening on port ${port}`));
  }).catch(err => {
    console.error(`Failed to initialize DB: ${err.message}`);
    throw new Error(err.message);
  });
}

module.exports = app;