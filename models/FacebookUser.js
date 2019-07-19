const mongoose = require("mongoose");
const Schema = mongoose.Schema  


let FacebookUserSchema = new Schema({
  _id: { type: Number, required: true },
  current: { type: String },
  status:{type:Number, required:true}
});

const FacebookUser = mongoose.model("FacebookUser", FacebookUserSchema);

module.exports = FacebookUser;