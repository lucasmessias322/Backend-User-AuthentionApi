const mongoose = require('mongoose')

const User = mongoose.model('User', {
  name: String,
  email: String,
  password: String,
  memorize: [
    {
      titulo: String,
      items: [
        // {
        //   questions: String,
        //   response: String
        // }
      ]
    }
  ]
})

module.exports = User
