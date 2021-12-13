const mongoose = require('mongoose')

const User = mongoose.model('User', {
  name: String,
  email: String,
  password: String,
  memorize: Array
})

module.exports = User
