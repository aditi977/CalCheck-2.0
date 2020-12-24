const mongoose = require("mongoose");
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
  const user = new Person({ name, email, password, favoriteFoods })
  user.save(function (err) {
    if (err) throw err;
  })
};

async function loginUser(email, password)
{
  const user = await Person.findOne({email: email}).exec();
  if(user.password != password)
  {
    throw new Error("Invalid authentication");
  }
  
  return user._id;
}

module.exports = {
  mongoose,
  registerUser,
  loginUser
}