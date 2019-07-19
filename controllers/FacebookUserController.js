const FacebookUser = require("../models/FacebookUser");

async function createUser(user) {
  const newUser = new FacebookUser(user);
  const res = await newUser.save().exec();
  return res;
}


