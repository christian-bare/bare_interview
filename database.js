// === FILE: database.js ===
const sqlite3 = require('sqlite3').verbose();

let db;
//let filePersistance = './bookstore.db'; // Used for file storage data persistence
let filePersistance = ':memory:'; // Used for in-memory data persistence

/**
 * Creates the DB, specifies table schema, and creates the table
 * Executed as a callback through a Promise; this is to ensure that the DB is initialized 
 *  before any interactions can begin
 */
function initializeDb() {
    return new Promise((resolve, reject) => {

        // Create a new DB object
        db = new sqlite3.Database(filePersistance, (err) => {
            if (err) {
                console.error(err.message);
                reject(err.message);
            } 
            console.log('Connected to the DB');
        });

        // Create the books table with the fields specified
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                price FLOAT,
                genre TEXT
                );
            `, (err) => {
                if (err) {
                    console.error("Error creating books table: ", err.message);
                    reject(err.message);
                }

                console.log("Books table created or already exists");
                resolve();
            });
        });
    });
}

/**
 * Gets the DB object, enabling interaction with the DB
 * @returns {sqlite3.Database} db - the DB object used to interact with the DB
 */
function getDb() {
    if (!db) {
        throw new Error('DB not initialized.')
    }
    return db;
}

module.exports = {
    getDb,
    initializeDb
};