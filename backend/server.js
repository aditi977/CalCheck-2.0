const mongoose = require("mongoose");
var jwt = require('jwt-simple');

const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
}).catch(e => console.error(e));

var Schema = mongoose.Schema;

var UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: String,
    favoriteFoods: [String]
  });


var Person = mongoose.model("Person", UserSchema)


function registerUser(name, email, password, favoriteFoods) {
  var pw_encoded = jwt.encode(password, process.env.SECRET_ENCRYPT);
  const user = new Person({ name, email, password: pw_encoded, favoriteFoods })
  user.save(function (err) {
    if (err) throw err;
  })
};

async function loginUser(email, password)
{
  const user = await Person.findOne({email: email}).exec();
  var pw_encoded = jwt.encode(password, process.env.SECRET_ENCRYPT);
  
  if(user.password != pw_encoded)
  {
    console.log(user.password);
    throw new Error("Invalid authentication");
  }
  
  return user._id;
}

module.exports = {
  mongoose,
  registerUser,
  loginUser,
  UserSchema
}