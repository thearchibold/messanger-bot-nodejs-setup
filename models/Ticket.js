const mongoose = require("mongoose");
const Schema = mongoose.Schema  


let TicketSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  price:{type:Number, required:true},
  owner:{type: Schema.Types.ObjectId, ref: "FacebookUser"}
});

const Ticket = mongoose.model("Ticket", TicketSchema);

module.exports = Ticket;

