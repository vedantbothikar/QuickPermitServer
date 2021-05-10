const mongoose = require("mongoose");

const createuserschema = new mongoose.Schema({
  inputjson: {
    type: String,
  }
});

const CreateUser = mongoose.model("CreateUser", createuserschema);

module.exports = CreateUser;
