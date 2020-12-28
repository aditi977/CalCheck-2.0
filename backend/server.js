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
    password: { type: String, required: true },
    eatenHistory: [{
      foodName: {type: String, required: true},
      foodURL: {type: String, required: true},
      imgSrc: {type: String, required: true},
      date: { type: Date, default: Date.now },
      calories: {type: Number, required: true}
    }]
  });


var Person = mongoose.model("Person", UserSchema)


function registerUser(name, email, password) {
  const user = new Person({ name, email, password, eatenHistory: [] })
  user.save(function (err) {
    if (err) throw err;
  })
};

async function loginUser(email, password) {
  const user = await Person.findOne({ email }).exec();
  if (user.password != password) {
    throw new Error("Invalid authentication");
  }
  
  return user._id;
}

//might need id instead of email
async function getCurrentUser(email)
{
  const user = await Person.findOne({ email }).exec();
  console.log("Get current user")
  console.log(user)
  return user;
}

async function addFoodToCurrentUser(email, foodName, foodURL, imgSrc, calories) {
  console.log(foodURL)
  const user = await Person.findOneAndUpdate({ email }, {
    $push: {
      eatenHistory:{
        foodName,
        foodURL,
        imgSrc,
        calories
      }
    }
  });
  console.log(user);
}

module.exports = {
  mongoose,
  registerUser,
  loginUser,
  addFoodToCurrentUser,
  getCurrentUser
}