const mongoose = require("mongoose");
const jwt = require('jwt-simple');

const bcrypt = require('bcrypt');
const saltRounds = 10;


const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).catch(e => console.error(e));

var Schema = mongoose.Schema;

var UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  eatenHistory: [{
    foodName: {
      type: String,
      required: true
    },
    foodURL: {
      type: String,
      required: true
    },
    imgSrc: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    calories: {
      type: Number,
      required: true
    }
  }]
});


var Person = mongoose.model("Person", UserSchema)


async function registerUser(name, email, password) {
  // var pw_encoded = jwt.encode(password, process.env.SECRET_ENCRYPT);
  bcrypt.hash(password, saltRounds, function (err, hash) {
    // Store hash in database here
    if (err) throw err;
    const user = new Person({
      name,
      email,
      password: hash,
      eatenHistory: []
    })
    user.save(function (err) {
      if (err) throw err;
    });
  });

};

async function loginUser(email, password) {
  const user = await Person.findOne({
    email: email
  }).exec();
  // var pw_encoded = jwt.encode(password, process.env.SECRET_ENCRYPT);
  var hash = user.password;
  bcrypt.compare(password, hash, function(err, result) {
    if (err) throw err;
    if (result) {
      return user._id;
    }else{
      throw new Error("Invalid authentication");
    }
  });
  

  
}

//might need id instead of email
async function getCurrentUser(email) {
  const user = await Person.findOne({
    email
  }).exec();
  // //console.log(user)
  return user;
}

async function addFoodToCurrentUser(email, foodName, foodURL, imgSrc, calories) {
  // const user = await Person.findOneAndUpdate({ email }, {
  await Person.findOneAndUpdate({
    email
  }, {
    $push: {
      eatenHistory: {
        foodName,
        foodURL,
        imgSrc,
        calories
      }
    }
  });
  // //console.log(user);
}

async function removeFoodFromCurrentUser(email, removedFoodId) {
  // const user = await Person.findOneAndUpdate({ email }, {
  await Person.findOneAndUpdate({
    email
  }, {
    $pull: {
      eatenHistory: {
        _id: removedFoodId
      }
    }
  });
  // //console.log(user);

}

async function changePersonalInfo(initEmail, name, email) {
  if (name !== '') {
    await Person.findOneAndUpdate({
      email: initEmail
    }, {
      name: name
    }, (err) => {
      if (err) throw err
    });
  }

  if (email !== '') {
    await Person.findOneAndUpdate({
      email: initEmail
    }, {
      email: email
    }, (err) => {
      if (err) throw err
    });
  }
}

async function changePassword(email, currPw, resetPw, retypedResetPw) {
  if (resetPw == null || email == null) {
    throw new Error("Invalid input");
  }
  if (resetPw == retypedResetPw) {
    pw_old = jwt.encode(currPw, process.env.SECRET_ENCRYPT);
    pw_updated = jwt.encode(resetPw, process.env.SECRET_ENCRYPT);
    const user = await Person.findOneAndUpdate({
      email: email,
      password: pw_old
    }, {
      password: pw_updated
    }, (err) => {
      if (err) throw err
    });
    // //console.log(pw_old)
    const test = await Person.findOne({
      email: email
    });
    // //console.log(email);
    // //console.log(test.password);
  }

  //WHAT IF NO ENTRIES WERE GIVEN???

}

module.exports = {
  mongoose,
  registerUser,
  loginUser,
  removeFoodFromCurrentUser,
  addFoodToCurrentUser,
  getCurrentUser,
  changePersonalInfo,
  changePassword,
  UserSchema,

}