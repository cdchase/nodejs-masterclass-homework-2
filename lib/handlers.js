/*
 * Request handlers
 *
 */
/* eslint-disable standard/no-callback-literal */

// Dependencies
const _data = require('./data')
const helpers = require('./helpers')
// const config = require('./config')

// Define the handlers
const handlers = {}

// Users
handlers.users = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback)
  } else {
    callback(405)
  }
}

// Container for the users submethods
handlers._users = {}

// Users - Post
// Required data: firstName, lastName, email, address (street, city, state/province/region, postal code, country[ISO 3166-1 alpha-2]), password
// Optional data: none
handlers._users.post = function (data, callback) {
  // Check that all required fields are filled out
  const firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const email = typeof (data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false
  const street = typeof (data.payload.street) === 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false
  const city = typeof (data.payload.city) === 'string' && data.payload.city.trim().length > 0 ? data.payload.city.trim() : false
  const state = typeof (data.payload.state) === 'string' && data.payload.state.trim().length > 0 ? data.payload.state.trim() : false
  const postalCode = typeof (data.payload.postalCode) === 'string' && data.payload.postalCode.trim().length > 0 ? data.payload.postalCode.trim() : false
  const country = typeof (data.payload.country) === 'string' && data.payload.country.trim().length === 2 ? data.payload.country.trim() : false
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  if (firstName && lastName && email && street && city && state && postalCode && country && password) {
    _data.read('users', email, function (err) {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password)

        // Create the user object
        if (hashedPassword) {
          const userObject = {
            'firstName': firstName,
            'lastname': lastName,
            'email': email,
            'street': street,
            'city': city,
            'state': state,
            'postalCode': postalCode,
            'country': country,
            'hashedPassword': hashedPassword,
          }

          // Store the user object
          _data.create('users', email, userObject, function (err) {
            if (!err) {
              callback(200)
            } else {
              console.log(err)
              callback(500, { 'Error': 'Could not create the new user.' })
            }
          })
        } else {
          callback(500, { 'Error': 'Could not hash the user\'s password.' })
        }
      } else {
        // User already exists
        callback(400, { 'Error': 'A user with that email already exists.' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required fields.' })
  }
}

// Users - get
// Required data: email
// Optional data: none
handlers._users.get = function (data, callback) {
// Check that the email is valid
  const email = typeof (data.queryStringObject.email) === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false
  if (email) {
    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
    // Verify the given token is valid for the email
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', email, function (err, data) {
          if (!err && data) {
            // Remove the hashed password from the user object before returning to the requester.
            delete data.hashedPassword
            callback(200, data)
          } else {
            callback(404)
          }
        })
      } else {
        callback(403, { 'Error': 'Missing required token in header, or token is invalid.' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field.' })
  }
}

// Users - put
// Required data: email
// Optional data: firstName, lastName, password (At least one must be specified.)
handlers._users.put = function (data, callback) {
  // Check for the required field
  const email = typeof (data.payload.email) === 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false

  // Check for the optional fields
  const firstName = typeof (data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false
  const lastName = typeof (data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false
  const street = typeof (data.payload.street) === 'string' && data.payload.street.trim().length > 0 ? data.payload.street.trim() : false
  const city = typeof (data.payload.city) === 'string' && data.payload.city.trim().length > 0 ? data.payload.city.trim() : false
  const state = typeof (data.payload.state) === 'string' && data.payload.state.trim().length > 0 ? data.payload.state.trim() : false
  const postalCode = typeof (data.payload.postalCode) === 'string' && data.payload.postalCode.trim().length > 0 ? data.payload.postalCode.trim() : false
  const country = typeof (data.payload.country) === 'string' && data.payload.country.trim().length === 2 ? data.payload.country.trim() : false
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  // Error if phone is invalid
  if (email) {
    // Error if nothing is sent to update
    if (firstName || lastName || street || city || state || postalCode || country || password) {
      // Get the token from the headers
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
      // Verify the given token is valid for the phone number
      handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
        if (tokenIsValid) {
          // Lookup the user
          _data.read('users', email, function (err, userData) {
            if (!err && userData) {
              // Update the fields necessary
              if (firstName) {
                userData.firstName = firstName
              }
              if (lastName) {
                userData.lastName = lastName
              }
              if (street) {
                userData.street = street
              }
              if (city) {
                userData.city = city
              }
              if (state) {
                userData.state = state
              }
              if (postalCode) {
                userData.postalCode = postalCode
              }
              if (country) {
                userData.country = country
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password)
              }

              // Store the updates
              _data.update('users', email, userData, function (err) {
                if (!err) {
                  callback(200)
                } else {
                  console.log(err)
                  callback(500, { 'Error': 'Could not update the user' })
                }
              })
            } else {
              callback(400, { 'Error': 'The specified user does not exist.' })
            }
          })
        } else {
          callback(403, { 'Error': 'Missing required token in header, or token is invalid.' })
        }
      })
    } else {
      callback(400, { 'Error': 'Missing fields to update.' })
    }
  } else {
    callback(400, { 'Error': 'Missing required field.' })
  }
}

// Users - delete
// Required field: phone
handlers._users.delete = function (data, callback) {
// Check that the phone number is valid
  const email = typeof (data.queryStringObject.email) === 'string' && data.queryStringObject.email.trim().length === 10 ? data.queryStringObject.email.trim() : false
  if (email) {
    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
    // Verify the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read('users', email, function (err, userData) {
          if (!err && userData) {
            _data.delete('users', email, function (err) {
              if (!err) {
                // Delete each of the checks associated with the user
                /*const userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : []
                const checksToDelete = userChecks.length
                if (checksToDelete > 0) {
                  let checksDeleted = 0
                  let deletionErrors = false
                  // Loop through the checks
                  userChecks.forEach(function (checkId) {
                    _data.delete('checks', checkId, function (err) {
                      if (err) {
                        deletionErrors = true
                      }
                      checksDeleted++
                      if (checksDeleted === checksToDelete) {
                        if (!deletionErrors) {
                          callback(200)
                        } else {
                          callback(500, { 'Error': 'Errors encountered while attempting to delete all of the user\'s checks. All checks may not have been deleted from the system successfully.' })
                        }
                      }
                    })
                  })
                } else {*/
                  callback(200)
                // }
              } else {
                callback(500, { 'Error': 'Could not delete the specified user.' })
              }
            })
          } else {
            callback(400, { 'Error': 'Could not find the specified user.' })
          }
        })
      } else {
        callback(403, { 'Error': 'Missing required token in header, or token is invalid.' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field.' })
  }
}

// Tokens
handlers.tokens = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback)
  } else {
    callback(405)
  }
}

// Container for the tokens methods
handlers._tokens = {}

// Tokens - post
handlers._tokens.post = function (data, callback) {
  const email = typeof (data.payload.email) === 'string' && data.payload.email.trim().length === 10 ? data.payload.email.trim() : false
  const password = typeof (data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false

  if (email && password) {
    // Lookup the user who matches that phone number
    _data.read('users', email, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password and compare to stored hashed password
        const hashedPassword = helpers.hash(password)
        if (hashedPassword === userData.hashedPassword) {
          // If valid, create a new token with a random name. Set expiration 1 hour in the future.
          const tokenId = helpers.createRandomString(20)
          const expires = Date.now() + 1000 * 60 * 60
          const tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          }

          // Store the token
          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject)
            } else {
              callback(500, { 'Error': 'Could not create the new token.' })
            }
          })
        } else {
          callback(400, { 'Error': 'Password did not match the specified user\'s stored password.' })
        }
      } else {
        callback(400, { 'Error': 'Could not fine the specified user.' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field(s).' })
  }
}

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
// Check that the id is valid
  const id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false
  if (id) {
    // Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData)
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field.' })
  }
}

// Tokens - put
// Required data: id, extend
// optional data: none
handlers._tokens.put = function (data, callback) {
  const id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false
  const extend = typeof (data.payload.extend) === 'boolean' && data.payload.extend === true
  if (id && extend) {
    // Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        // Check to make sure current token is not already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration to an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60

          // Store the new token
          _data.update('tokens', id, tokenData, function (err) {
            if (!err) {
              callback(200)
            } else {
              callback(500, { 'Error': 'Could not update the token\'s expiration.' })
            }
          })
        } else {
          callback(400, { 'Error': 'The token has already expired and cannot be extended.' })
        }
      } else {
        callback(400, { 'Error': 'Ths specified token does not exist.' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field(s) or field(s) are invalid.' })
  }
}

// Tokens - delete
handlers._tokens.delete = function (data, callback) {
// Check that the id number is valid
  const id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false
  if (id) {
    // Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        _data.delete('tokens', id, function (err) {
          if (!err) {
            callback(200)
          } else {
            callback(500, { 'Error': 'Could not delete the specified token.' })
          }
        })
      } else {
        callback(400, { 'Error': 'Could not find the specified token.' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field.' })
  }
}

// Verify if a given token is valid for a given user
// Required data: id, phone
// Optional data: none
handlers._tokens.verifyToken = function (id, phone, callback) {
// Lookup the token
  _data.read('tokens', id, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and not expired
      if (tokenData.email === email && tokenData.expires > Date.now()) {
        callback(true)
      } else {
        callback(false)
      }
    } else {
      callback(false)
    }
  })
}

/*

// Checks
handlers.checks = function (data, callback) {
  const acceptableMethods = ['post', 'get', 'put', 'delete']
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback)
  } else {
    callback(405)
  }
}

// Container for the checks methods
handlers._checks = {}

// Checks - post
// Required data: protocol, url, method,successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = function (data, callback) {
// Validate inputs
  const protocol = typeof (data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false
  const url = typeof (data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false
  const method = typeof (data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false
  const successCodes = typeof (data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false
  const timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get the token from the headers
    const token = typeof (data.headers.token) === 'string' ? data.headers.token : false

    // Lookup the user by reading the token
    _data.read('tokens', token, function (err, tokenData) {
      if (!err && tokenData) {
        const userPhone = tokenData.phone

        // Lookup the user data
        _data.read('users', userPhone, function (err, userData) {
          if (!err && userData) {
            const userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : []
            // Verify the user has less than the number of max-checks-per-user
            if (userChecks.length < config.maxChecks) {
              // Create a random id for the check
              const checkId = helpers.createRandomString(20)

              // Create the check object and include the user's phone
              const checkObject = {
                'id': checkId,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeoutSeconds': timeoutSeconds
              }
              // Save the object
              _data.create('checks', checkId, checkObject, function (err) {
                if (!err) {
                  // Add the check id to the user's object
                  userData.checks = userChecks
                  userData.checks.push(checkId)

                  // Save the new user data
                  _data.update('users', userPhone, userData, function (err) {
                    if (!err) {
                      callback(200, checkObject)
                    } else {
                      callback(500, { 'Error': 'Error updating user object with new check.' })
                    }
                  })
                } else {
                  callback(500, { 'Error': 'Error storing check object.' })
                }
              })
            } else {
              callback(400, { 'Error': 'The user already has the maximum number of checks (' + config.maxChecks + ')' })
            }
          } else {
            callback(403)
          }
        })
      } else {
        callback(403)
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required inputs or inputs are invalid.' })
  }
}

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = function (data, callback) {
// Check that the id is valid
  const id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false
  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token from the headers
        const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
        // Verify the given token is valid and belongs to the user that created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
          if (tokenIsValid) {
            callback(200, checkData)
          } else {
            callback(403)
          }
        })
      } else {
        callback(404)
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field.' })
  }
}

// Checks - put
// Required data: id
// Optional data: protocol, url, method,successCodes, timeoutSeconds (At least one must be specified.)
handlers._checks.put = function (data, callback) {
  // Check for the required field
  const id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false

  // Check for the optional fields
  const protocol = typeof (data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false
  const url = typeof (data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false
  const method = typeof (data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false
  const successCodes = typeof (data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false
  const timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false

  // Check to make sure id is valid
  if (id) {
    // Check to make sure one or more optional fields have been sent
    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read('checks', id, function (err, checkData) {
        if (!err && checkData) {
          // Get the token from the headers
          const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
          // Verify the given token is valid and belongs to the user that created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
            if (tokenIsValid) {
              // Update the check where necessary
              if (protocol) {
                checkData.protocol = protocol
              }
              if (url) {
                checkData.url = url
              }
              if (method) {
                checkData.method = method
              }
              if (successCodes) {
                checkData.successCodes = successCodes
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds
              }

              // Store the updated check
              _data.update('checks', id, checkData, function (err) {
                if (!err) {
                  callback(200)
                } else {
                  callback(500, { 'Error': 'could not update the check' })
                }
              })
            } else {
              callback(403)
            }
          })
        } else {
          callback(400, { 'Error': 'Check id did not exist.' })
        }
      })
    } else {
      callback(400, { 'Error': 'Missing fields to update.' })
    }
  } else {
    callback(400, { 'Error': 'Missing required field.' })
  }
}

// Checks - delete
// Required data: id
// Optional data: none
handlers._checks.delete = function (data, callback) {
// Check that the id is valid
  const id = typeof (data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false
  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // Get the token from the headers
        const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
        // Verify the given token is valid for the phone number
        handlers._tokens.verifyToken(token, checkData.userPhone, function (tokenIsValid) {
          if (tokenIsValid) {
            // Delete the check data
            _data.delete('checks', id, function (err) {
              if (!err) {
                // Lookup the user
                _data.read('users', checkData.userPhone, function (err, userData) {
                  if (!err && userData) {
                    const userChecks = typeof (userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : []

                    // Remove the deleted check from thier list of checks
                    const checkPosition = userChecks.indexOf(id)
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1)

                      // Re-save the users data
                      _data.update('users', checkData.userPhone, userData, function (err) {
                        if (!err) {
                          callback(200)
                        } else {
                          callback(500, { 'Error': 'Could not update the specified user.' })
                        }
                      })
                    } else {
                      callback(500, { 'Error': 'Could not find the check on the user object, so could not remove it.' })
                    }
                  } else {
                    callback(500, { 'Error': 'Could not find the user that created the check, so could not delete the check data on the user object.' })
                  }
                })
              } else {
                callback(500, { 'Error': 'Could not delete the check data.' })
              }
            })
          } else {
            callback(403)
          }
        })
      } else {
        callback(400, { 'Error': 'The specified check ID does not exist.' })
      }
    })
  } else {
    callback(400, { 'Error': 'Missing required field.' })
  }
}
*/

// Ping handler
handlers.ping = function (data, callback) {
// Callback an http status code and a payload object
  callback(200)
}

handlers.notFound = function (data, callback) {
  callback(404)
}

module.exports = handlers
