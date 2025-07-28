// === FILE: lib.js ===

/**
 * Input validation method for the ID
 * The ID must be a positive integer
 * 
 * @param {Object} data - the data here is the ID of the entry
 * @returns {Array<string>} - An array of strings detailing the failures
 */
function inputValidationId(data) {
    const errors = [];
    const dataNum = Number(data);
    if (!Number.isInteger(dataNum) || dataNum <= 0) {
       errors.push("'id' must be a positive integer.");
    }

    return errors;
}

/**
 * Input validation method for the payload body
 * This object can include 'title', 'author', 'price', or 'genre'
 * Any additional field with result in an error message
 * 'title' and 'author' are required strings 
 * 'price' is an optional number with a null default
 * 'genre' is an optional string with a null default
 * 
 * @param {Object} data - the object that contains the info for the entry, excluding the id
 * - {string} title - the title of the book (required)
 * - {string} author - the author of the books (required)
 * - {number} price - the price of the book
 * - {string} genre - the genre of the books
 * @returns {Array<string>} - An array of strings detailing the failures
 */
function inputValidationBody(data) {
    const errors = [];
    const expectedFields = ['title', 'author', 'price', 'genre'];
    const extraFields = Object.keys(data).filter(key => !expectedFields.includes(key));

    if (extraFields.length > 0) {
        extraFields.forEach(field => {
            errors.push(`'${field}' is not an expected field. Please remove this from payload.`);
        })
    }
    
    // Fields are required and must be strings
    ['title', 'author'].forEach(field => {
        if(!(field in data)) {
            errors.push(`'${field}' is required.`);
        } else if (typeof data[field] !== 'string') {
            errors.push(`'${field}' must be a string.`);
        }
    });

    // Fields must be finite numbers
    ['price'].forEach(field => {
        if (field in data) {
            const value = Number(data[field]);
            if (typeof data[field] == 'boolean' || isNaN(value)) {
                errors.push(`'${field}' must be a valid number.`);
            }
        }
    });

    // Fields must be strings
    ['genre'].forEach(field => {
        if (field in data) {
            if (typeof data[field] !== 'string') {
                errors.push(`'${field}' must be a string.`);
            }
        }
    });

    return errors;
}

module.exports = {
    inputValidationId, inputValidationBody
}