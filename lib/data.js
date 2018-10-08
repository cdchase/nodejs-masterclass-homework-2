/*
 * Library for storing and editing data
 *
 */
/* eslint-disable standard/no-callback-literal */

const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')

const lib = {}

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/')

// Write data to a file
lib.create = function (dir, file, data, callback) {
// Open the file for writing
  const fullFilename = lib.baseDir + dir + '/' + file + '.json'
  fs.open(fullFilename, 'wx', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data)

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false)
            } else {
              callback('Error closing new file.')
            }
          })
        } else {
          callback('Error writing to new file.')
        }
      })
    } else {
      callback('Could not create new file, it may already exist.')
    }
  })
}

// Read data from a file
lib.read = function (dir, file, callback) {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function (err, data) {
    if (!err && data) {
      const parsedData = helpers.parseJsonToObject(data)
      callback(false, parsedData)
    } else {
      callback(err, data)
    }
  })
}

lib.update = function (dir, file, data, callback) {
  // Open the file for writing
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data)

      // Truncate the file
      fs.ftruncate(fileDescriptor, function (err) {
        if (!err) {
          fs.writeFile(fileDescriptor, stringData, function (err) {
            if (!err) {
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  callback(false)
                } else {
                  callback('Error closing existing file.')
                }
              })
            } else {
              callback('Error writing to existing file.')
            }
          })
        } else {
          callback('Error truncating file.')
        }
      })
    } else {
      callback('Could not open file for updating, it may not exist yet.')
    }
  })
}

// Delete a file
lib.delete = function (dir, file, callback) {
  // Unlink the file
  fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
    if (!err) {
      callback(false)
    } else {
      callback('Error deleting file.')
    }
  })
}

// List all the items in a directory
lib.list = function (dir, callback) {
  fs.readdir(lib.baseDir + dir + '/', function (err, data) {
    if (!err && data && data.length > 0) {
      const trimmedFilenames = []
      data.forEach(function (fileName) {
        trimmedFilenames.push(fileName.replace('.json', ''))
      })
      callback(false, trimmedFilenames)
    } else {
      callback(err, data)
    }
  })
}

module.exports = lib
