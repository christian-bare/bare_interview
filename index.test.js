// === FILE: index.test.js ===
/**
 * @file index.test.js
 * @description The test suite for the Bookstore API - Coding Challenge
 * 
 * This test suite is comprised of 41 tests covering positive, negative, and additioanal scenarios
 * 
 * Endpoints covered:
 * - GET /books
 * - GET /books/:id
 * - POST /books
 * - PUT /books/:id
 * - DELETE /books/:id
 */
const request = require('supertest');
const app = require('./index');
const {getDb, initializeDb} = require('./database');

let db;

/**
 * These tests cover the 'Happy Path' 
 */
describe('Bookstore API - Positive Scenarios', () => {

  // Executes before any test; connects to the DB and cleans the data; populates with sample data
  beforeAll(async () => {
    await initializeDb();
    db = getDb();
    // Async call to remove all data from the DB and add sample data; this will NOT reset the id auto-increment
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM books', (err) => {
          if (err) {
            reject(`DELETE FROM statement failed: ${err.message}`)
          }
        });

        // Prepare the INSERT INTO statement and add sample data
        const insertStatement = db.prepare(`INSERT INTO books (title, author, price, genre) VALUES (?, ?, ?, ?);`, (err) => {
          if (err) {
            reject(`Preparing INSERT statement failed: ${err.message}`)
          }
        });

        insertStatement.run("Title 1", "Author 1", 100, "Genre 1", (err) => {
          if (err) {
            reject(`INSERT statement #1 failed: ${err.message}`);
          }
        });

        insertStatement.run("Title 2", "Author 2", 200, "Genre 2", (err) => {
          if (err) {
            reject(`INSERT statement #2 failed: ${err.message}`);
          }
        });

        insertStatement.run("Title 3", "Author 3", null, "Genre 3", (err) => {
          if (err) {
            reject(`INSERT statement #3 failed: ${err.message}`);
          }
        });

        insertStatement.run("Title 4", "Author 4", 400, null, (err) => {
          if (err) {
            reject(`INSERT statement #4 failed: ${err.message}`);
          }
        });

        insertStatement.run("Title 5", "Author 5", null, null, (err) => {
          if (err) {
            reject(`INSERT statement #5 failed: ${err.message}`);
          }
        });

        insertStatement.finalize(err => {
          if (err) {
            reject(`Finalize failed: ${err.message}`);
          } else {
            resolve();
          }
        });
      });
    });
  });

  // Closes the DB connection after all tests execute
  afterAll(async () => {
    await db.close();
  });

  test('GET /books - Returns all users from sample data', async () => {
    // Get all books
    const res = await request(app).get('/books');

    // Validate the status code and structure
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(5);
    res.body.forEach(row => {
      expect(row).toHaveProperty('id');
      expect(row).toHaveProperty('title');
      expect(row).toHaveProperty('author');
      expect(row).toHaveProperty('price');
      expect(row).toHaveProperty('genre');
    })
  });

  /**
   * Input Validations for POST /books
   */
  test('POST /books - Create a new book', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 6",
      author: "Author 6",
      price: 123.45,
      genre: "Genre 6"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Book added successfully');
    expect(res.body.id).toBeDefined();

    // Async call to validate new entry in DB
    const addedRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [res.body.id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Validate that the data from the api matches that of the DB
    expect(addedRow.title).toBe(newRow.title);
    expect(addedRow.author).toBe(newRow.author);
    expect(addedRow.price).toBe(newRow.price);
    expect(addedRow.genre).toBe(newRow.genre);
  });

  test('POST /books - Create new row without price', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 6",
      author: "Author 6",
      genre: "Genre 6"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Book added successfully');
    expect(res.body.id).toBeDefined();

    // Async call to validate new entry in DB
    const addedRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [res.body.id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    
    // Validate that the data from the api matches that of the DB
    expect(addedRow.title).toBe(newRow.title);
    expect(addedRow.author).toBe(newRow.author);
    expect(addedRow.price).toBe(null); // If not specified, the default is null
    expect(addedRow.genre).toBe(newRow.genre);
  });

  test('POST /books - Create new row without genre', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 6",
      author: "Author 6",
      price: 123.45
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Book added successfully');
    expect(res.body.id).toBeDefined();

    // Async call to validate new entry in DB
    const addedRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [res.body.id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Validate that the data from the api matches that of the DB
    expect(addedRow.title).toBe(newRow.title);
    expect(addedRow.author).toBe(newRow.author);
    expect(addedRow.price).toBe(newRow.price);
    expect(addedRow.genre).toBe(null); // If not specified, the default is null
  });

  /**
   * Input Validations for GET /books/:id
   */
  test('GET /books/:id - Specific id returns intended data', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 7",
      author: "Author 7",
      price: 678.90,
      genre: "Genre 7"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;

    // Call the endpoint
    const getRes = await request(app).get(`/books/${id}`);

    // Validate the response
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.title).toBe(newRow.title);
    expect(getRes.body.author).toBe(newRow.author);
    expect(getRes.body.price).toBe(newRow.price);
    expect(getRes.body.genre).toBe(newRow.genre);
    expect(getRes.body.id).toBe(id);
  });

  /**
   * Input Validations for PUT /books/:id
   */
  test('PUT /books/:id - Update the specified entry', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 8",
      author: "Author 8",
      price: 123.45,
      genre: "Genre 8"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;

    // Declare updated data to replace the original data
    const updatedData = {
      title: "Title 8 - Updated",
      author: "Author 8 - Updated",
      price: 555.55,
      genre: "Genre 8 - Updated"
    };

    // Call the endpoint
    const putRes = await request(app).put(`/books/${id}`).send(updatedData);

    // Validate the response
    expect(putRes.statusCode).toBe(201);
    expect(putRes.body.message).toBe('Book updated successfully');
    expect(putRes.body.id).toBeDefined();

    // Async call to validate updated entry in DB
    const modifiedRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Validate the response
    expect(modifiedRow.title).toBe(updatedData.title);
    expect(modifiedRow.author).toBe(updatedData.author);
    expect(modifiedRow.price).toBe(updatedData.price);
    expect(modifiedRow.genre).toBe(updatedData.genre);
    expect(modifiedRow.id).toBe(id);
  });

  test('PUT /books/:id - Update the specified entry without a price', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 8",
      author: "Author 8",
      price: 123.45,
      genre: "Genre 8"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;

    // Declare data for the update
    const updatedData = {
      title: "Title 8 - Updated",
      author: "Author 8 - Updated",
      genre: "Genre 8 - Updated"
    };

    // Call the endpoint
    const putRes = await request(app).put(`/books/${id}`).send(updatedData);

    // Validate the response
    expect(putRes.statusCode).toBe(201);
    expect(putRes.body.message).toBe('Book updated successfully');
    expect(putRes.body.id).toBeDefined();

    // Async call to validate updated entry in DB
    const modifiedRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Validate the response
    expect(modifiedRow.title).toBe(updatedData.title);
    expect(modifiedRow.author).toBe(updatedData.author);
    expect(modifiedRow.price).toBe(null);
    expect(modifiedRow.genre).toBe(updatedData.genre);
    expect(modifiedRow.id).toBe(id);
  });

  test('PUT /books/:id - Update the specified entry without a genre', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 8",
      author: "Author 8",
      price: 123.45,
      genre: "Genre 8"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;

    
    // Declare data for the update
    const updatedData = {
      title: "Title 8 - Updated",
      author: "Author 8 - Updated",
      price: 678.90
    };

    // Call the endpoint
    const putRes = await request(app).put(`/books/${id}`).send(updatedData);

    // Validate the response
    expect(putRes.statusCode).toBe(201);
    expect(putRes.body.message).toBe('Book updated successfully');
    expect(putRes.body.id).toBeDefined();

    // Async call to validate updated entry in DB
    const modifiedRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Validate the response
    expect(modifiedRow.title).toBe(updatedData.title);
    expect(modifiedRow.author).toBe(updatedData.author);
    expect(modifiedRow.price).toBe(updatedData.price);
    expect(modifiedRow.genre).toBe(null);
    expect(modifiedRow.id).toBe(id);
  });

  /**
   * Input Validations for DELETE /books/:id
   */
  test('DELETE /books/:id - Delete the specified entry', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 9",
      author: "Author 9",
      price: 999.99,
      genre: "Genre 9"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;

    // Async call to validate new entry in DB
    const addedRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    // Validate the response
    expect(addedRow.title).toBe("Title 9");
    expect(addedRow.author).toBe("Author 9");
    expect(addedRow.price).toBe(999.99);
    expect(addedRow.genre).toBe("Genre 9");

    // Call the endpoint
    const deleteRes = await request(app).delete(`/books/${id}`);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.message).toBe('Book successfully deleted');
    expect(deleteRes.body.id).toBeDefined();

    // Call the endpoint
    const getRes = await request(app).get(`/books/${id}`);
    expect(getRes.statusCode).toBe(404);

    // Async call to validate deleted entry in DB
    const deletedRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    
    // Validate the response
    expect(deletedRow).toBeUndefined();
  });

  test('Validate that the ID is a Primary Key', async () => {
    // Async call to validate uniqueness in the 'id' field
    const data = await new Promise((resolve, reject) => {
      db.get('PRAGMA table_info(books)', [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    
    // Validate the response
    expect(data.name).toBe('id');
    expect(data.pk).toBe(1);
  
  });
});

/**
 * These tests cover the negative scenarios; focuses heavily on input validation
 */
describe('Bookstore API - Negative Scenarios', () => {

  // Executes before any test; connects to the DB and cleans the data; populates with sample data
  beforeAll(async () => {
    await initializeDb();
    db = getDb();
    // Async call to remove all data from the DB and add sample data; this will NOT reset the id auto-increment
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM books', (err) => {
          if (err) {
            reject(`DELETE FROM statement failed: ${err.message}`)
          }
        });

        // Prepare the INSERT INTO statement and add sample data
        const insertStatement = db.prepare(`INSERT INTO books (title, author, price, genre) VALUES (?, ?, ?, ?);`, (err) => {
          if (err) {
            reject(`Preparing INSERT statement failed: ${err.message}`)
          }
        });

        insertStatement.run("Title 1", "Author 1", 100, "Genre 1", (err) => {
          if (err) {
            reject(`INSERT statement #1 failed: ${err.message}`);
          }
        });

        insertStatement.run("Title 2", "Author 2", 200, "Genre 2", (err) => {
          if (err) {
            reject(`INSERT statement #2 failed: ${err.message}`);
          }
        });

        insertStatement.run("Title 3", "Author 3", null, "Genre 3", (err) => {
          if (err) {
            reject(`INSERT statement #3 failed: ${err.message}`);
          }
        });

        insertStatement.run("Title 4", "Author 4", 400, null, (err) => {
          if (err) {
            reject(`INSERT statement #4 failed: ${err.message}`);
          }
        });

        insertStatement.run("Title 5", "Author 5", null, null, (err) => {
          if (err) {
            reject(`INSERT statement #5 failed: ${err.message}`);
          }
        });

        insertStatement.finalize(err => {
          if (err) {
            reject(`Finalize failed: ${err.message}`);
          } else {
            resolve();
          }
        });
      });
    });
  });

  // Closes the DB connection after all tests execute
  afterAll(async () => {
    await db.close();
  });

  /**
   * Input Validations for GET /books/:id
   */
  test('GET /books/:id - input validation - ID that does not exist', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;

    // Call the endpoint
    const getRes = await request(app).get(`/books/${Number(id) + 1}`);

    // Validate the response
    expect(getRes.statusCode).toBe(404);
    expect(getRes.body.message).toBe(`Book with ID: ${Number(id) + 1} not found`);
  });
  
  test('GET /books/:id - input validation - ID as a string', async () => {
    // Call the endpoint
    const getRes = await request(app).get(`/books/test`);
    
    // Validate the response
    expect(getRes.statusCode).toBe(400);
    expect(getRes.body.errors[0]).toBe(`'id' must be a positive integer.`);
  });

  test('GET /books/:id - input validation - ID as 0', async () => {
    // Call the endpoint
    const getRes = await request(app).get(`/books/0`);
    
    // Validate the response
    expect(getRes.statusCode).toBe(400);
    expect(getRes.body.errors[0]).toBe(`'id' must be a positive integer.`);
  });

  test('GET /books/:id - input validation - ID as a negative number', async () => {
    // Call the endpoint
    const getRes = await request(app).get(`/books/-1`);

    // Validate the response
    expect(getRes.statusCode).toBe(400);
    expect(getRes.body.errors[0]).toBe(`'id' must be a positive integer.`);
  });

  /**
   * Input Validations for POST /books
   */
  test('POST /books - input validation - POST without "title"', async () => {
    // Declare data to be added
    const newRow = {
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'title' is required.`);
  });

  test('POST /books - input validation - POST without "author"', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'author' is required.`);
  });

  test('POST /books - input validation - POST with "title" as a number', async () => {
    // Declare data to be added
    const newRow = {
      title: 10,
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'title' must be a string.`);
  });

  test('POST /books - input validation - POST with "title" as a boolean', async () => {
    // Declare data to be added
    const newRow = {
      title: true,
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'title' must be a string.`);
  });

  test('POST /books - input validation - POST with "author" as a number', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: 10,
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'author' must be a string.`);
  });

  test('POST /books - input validation - POST with "author" as a boolean', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: true,
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'author' must be a string.`);
  });

  test('POST /books - input validation - POST with "price" as a string', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: "A number",
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'price' must be a valid number.`);
  });

  test('POST /books - input validation - POST with "price" as a boolean', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: true,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'price' must be a valid number.`);
  });

  test('POST /books - input validation - POST with "genre" as a number', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: 10
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'genre' must be a string.`);
  });

  test('POST /books - input validation - POST with "genre" as a boolean', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: true
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'genre' must be a string.`);
  });

  test('POST /books - input validation - POST with extra field', async () => {
    // Declare data to be added with extra field
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10",
      isbn: 1234567890
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);

    // Validate the response
    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0]).toBe(`'isbn' is not an expected field. Please remove this from payload.`);
  });

  /**
   * Input Validations for PUT /books/:id
   */
  test('PUT /books/:id - input validation - PUT with "title" as a number', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: 10,
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'title' must be a string.`);
  });

  test('PUT /books/:id - input validation - PUT with "title" as a boolean', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: true,
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'title' must be a string.`);
  });

  test('PUT /books/:id - input validation - PUT with "author" as a number', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: "Title 10",
      author: 10,
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'author' must be a string.`);
  });

  test('PUT /books/:id - input validation - PUT with "author" as a boolean', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: "Title 10",
      author: true,
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'author' must be a string.`);
  });

  test('PUT /books/:id - input validation - PUT with "price" as a string', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: "Title 10",
      author: "Author 10",
      price: "A number",
      genre: "Genre 10"
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'price' must be a valid number.`);
  });

  test('PUT /books/:id - input validation - PUT with "price" as a boolean', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: "Title 10",
      author: "Author 10",
      price: true,
      genre: "Genre 10"
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'price' must be a valid number.`);
  });

  test('PUT /books/:id - input validation - PUT with "genre" as a number', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: 10
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'genre' must be a string.`);
  });

  test('PUT /books/:id - input validation - PUT with "genre" as a boolean', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: true
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'genre' must be a string.`);
  });

  test('PUT /books/:id - input validation - PUT with ID that does not exist', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: "Title 10 - Updated",
      author: "Author 10 - Updated",
      price: 678.90,
      genre: "Genre 10 - Updated"
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${Number(id) + 1}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(404);
    expect(resPut.body.message).toBe(`Book with ID: ${Number(id) + 1} not found`);
  });

  test('PUT /books/:id - input validation - PUT with an extra field', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    
    // Declare data for the update
    const updatedRow = {
      title: "Title 10 - Updated",
      author: "Author 10 - Updated",
      price: 678.90,
      genre: "Genre 10 - Updated",
      isbn: 1234567890
    };

    // Call the endpoint
    const resPut = await request(app).put(`/books/${id}`).send(updatedRow);

    // Validate the response
    expect(resPut.statusCode).toBe(400);
    expect(resPut.body.errors[0]).toBe(`'isbn' is not an expected field. Please remove this from payload.`);
  });

  /**
   * Input Validations for DELETE /books/:id
   */
  test('DELETE /books/:id - input validation - ID that does not exist', async () => {
    // Declare data to be added
    const newRow = {
      title: "Title 10",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 10"
    };

    // Call the endpoint
    const res = await request(app).post('/books').send(newRow);
    const id = res.body.id;
    const deleteRes = await request(app).delete(`/books/${Number(id) + 1}`);

    // Validate the response
    expect(deleteRes.statusCode).toBe(404);
    expect(deleteRes.body.message).toBe(`Book with ID: ${Number(id) + 1} not found`);
  });
  
  test('DELETE /books/:id - input validation - ID as a string', async () => {
    // Call the endpoint
    const deleteRes = await request(app).get(`/books/test`);
    
    // Validate the response
    expect(deleteRes.statusCode).toBe(400);
    expect(deleteRes.body.errors[0]).toBe(`'id' must be a positive integer.`);
  });

  test('DELETE /books/:id - input validation - ID as 0', async () => {
    // Call the endpoint
    const deleteRes = await request(app).get(`/books/0`);
    
    // Validate the response
    expect(deleteRes.statusCode).toBe(400);
    expect(deleteRes.body.errors[0]).toBe(`'id' must be a positive integer.`);
  });

  test('DELETE /books/:id - input validation - ID as a negative number', async () => {
    // Call the endpoint
    const deleteRes = await request(app).get(`/books/-1`);

    // Validate the response
    expect(deleteRes.statusCode).toBe(400);
    expect(deleteRes.body.errors[0]).toBe(`'id' must be a positive integer.`);
  });
});

/**
 * These tests cover the additional scenarios
 */
describe('Bookstore API - Additional Scenarios', () => {

  // Executes before any test; connects to the DB and cleans the data
  beforeAll(async () => {
    await initializeDb();
    db = getDb();
    // Async call to remove all data from the DB; this will NOT reset the id auto-increment
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM books', (err) => {
          if (err) {
            reject(`DELETE FROM statement failed: ${err.message}`)
          }
          resolve()
        });
      });
    });
  });

  // Closes the DB connection after all tests execute
  afterAll(async () => {
    await db.close();
  });

  test('GET /books - Returns empty array for table with no data', async () => {
    // Get all data from endpoint - should be empty
    const res = await request(app).get('/books');

    // Validate response
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(0);
    expect(res.body).toStrictEqual([]);
  });

  test('Validate that the ID auto-increments for each new entry', async () => {
    // Declare data for the first row to be added
    const firstNewRow = {
      title: "Title 20",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 20"
    };

    // Call the endpoint
    const firstResPost = await request(app).post('/books').send(firstNewRow);
    const firstId = firstResPost.body.id;

    // Declare data for the second row to be added
    const secondNewRow = {
      title: "Title 20",
      author: "Author 10",
      price: 123.45,
      genre: "Genre 20"
    };

    // Call the endpoint
    const secondResPost = await request(app).post('/books').send(secondNewRow);
    const secondId = secondResPost.body.id;

    // Validate that the id incremented
    expect(Number(firstId) + 1).toBe(Number(secondId));
  
  });

});