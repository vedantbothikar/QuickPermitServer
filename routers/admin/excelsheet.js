// packages
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

// Models
const User = require("../../models/User");

// functionalities
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../config/auth");

// packages required for excel sheet
var bodyParser = require("body-parser");
var multer = require("multer");
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");

//multers disk storage settings
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __basedir + "/uploads");
  },
  filename: function (req, file, cb) {
    var datetimestamp = Date.now();
    // we store the excel sheet with custom name
    cb(
      null,
      file.fieldname +
        "-" +
        datetimestamp +
        "." +
        file.originalname.split(".")[file.originalname.split(".").length - 1]
    );
  },
});

// multer settings
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    //file filtering
    if (
      ["xls", "xlsx"].indexOf(
        file.originalname.split(".")[file.originalname.split(".").length - 1]
      ) === -1
    ) {
      // extension type problem
      return callback(new Error("Wrong extension type"));
    }
    callback(null, true);
  },
}).single("file");

// post request for uploading of excel sheet
router.post("/upload", ensureAuthenticated, function (req, res) {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  // data
  var exceltojson;
  var newusercount = 0;
  var existingusercount = 0;
  var newuserarray = [];
  var existinguserarray = [];

  upload(req, res, function (err) {
    if (err) {
      res.json({ error_code: 1, err_desc: err });
      console.log(err);
      return;
    }
    /** Multer gives us file info in req.file object */
    if (!req.file) {
      // handling case when no file has been uploaded
      res.render("admin/excelsheet/nofileuploaded.ejs", {
        user: req.user,
      });
      return;
    }

    /* Check the extension of the incoming file and
       use the appropriate module */

    // setting according to extension type
    if (
      req.file.originalname.split(".")[
        req.file.originalname.split(".").length - 1
      ] === "xlsx"
    ) {
      exceltojson = xlsxtojson;
    } else {
      exceltojson = xlstojson;
    }

    try {
      // actual conversion from excel to json
      exceltojson(
        {
          input: req.file.path,
          output: null, //since we don't need output.json
          lowerCaseHeaders: true,
        },
        async (err, result) => {
          if (err) {
            return res.json({ error_code: 1, err_desc: err, data: null });
          }

          // here we can access result
          // logic of creating new users goes here
          for (var i = 0; i < result.length; i++) {
            const name = result[i].name;
            const email = result[i].email;
            const password = result[i].regid;
            const password2 = result[i].regid;
            const regid = result[i].regid;
            const position = result[i].position;
            const year = result[i].year;

            User.findOne({
              $or: [{ email: email }, { regid: regid }],
            }).then((user) => {
              if (user) {
                existingusercount = existingusercount + 1;
                existinguserarray.push(user);

                if (existingusercount === result.length) {
                  // deleting the file from database
                  var fs = require("fs");
                  fs.unlinkSync(req.file.path);

                  // rendering the page when all the users already exits
                  res.render("admin/excelsheet/allusersexist.ejs", {
                    user: req.user,
                  });
                }
              } else {
                // create new user model
                const newUser = new User({
                  name,
                  email,
                  password,
                  regid,
                  position,
                  year,
                });

                // hashing password
                bcrypt.genSalt(10, (err, salt) => {
                  bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser
                      .save()
                      .then((user) => {
                        newusercount = newusercount + 1;
                        newuserarray.push(user);

                        if (
                          newusercount + existingusercount ===
                          result.length
                        ) {
                          //    deleting the file from database
                          var fs = require("fs");
                          fs.unlinkSync(req.file.path);

                          // rendering page with table of users created
                          res.render("admin/excelsheet/result.ejs", {
                            result: result,
                            newuserarray: newuserarray,
                            existinguserarray: existinguserarray,
                            user: req.user,
                          });
                        }
                      })
                      .catch((err) => console.log(err));
                  });
                });
              }
            });
          }
        }
      );
    } catch (e) {
      res.json({ error_code: 1, err_desc: "Corupted excel file" });
    }
  });
});

// result page for excel sheet route
router.get("/result", ensureAuthenticated, (req, res) => {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  res.render("admin/excelsheet/result.ejs");
});

module.exports = router;
