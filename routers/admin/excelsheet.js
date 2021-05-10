const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../config/auth");
const { findById } = require("../../models/form");

// required for excel sheet
var bodyParser = require("body-parser");
var multer = require("multer");
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");

var storage = multer.diskStorage({
  //multers disk storage settings
  destination: function (req, file, cb) {
    cb(null, __basedir + "/uploads");
    // cb(null, __dirname.replace("admin", "") + "excelupload");
    // path.join(__dirname, "../../public/uploads")
  },
  filename: function (req, file, cb) {
    var datetimestamp = Date.now();
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

var upload = multer({
  //multer settings
  storage: storage,
  fileFilter: function (req, file, callback) {
    //file filter
    if (
      ["xls", "xlsx"].indexOf(
        file.originalname.split(".")[file.originalname.split(".").length - 1]
      ) === -1
    ) {
      return callback(new Error("Wrong extension type"));
    }
    callback(null, true);
  },
}).single("file");

router.post("/upload", ensureAuthenticated, function (req, res) {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

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
      // res.json({ error_code: 1, err_desc: "No file passed" });
      res.render("admin/excelsheet/nofileuploaded.ejs", {
        user: req.user,
      });
      return;
    }
    /** Check the extension of the incoming file and
     *  use the appropriate module
     */
    if (
      req.file.originalname.split(".")[
        req.file.originalname.split(".").length - 1
      ] === "xlsx"
    ) {
      exceltojson = xlsxtojson;
    } else {
      exceltojson = xlstojson;
    }
    console.log(req.file.path);
    try {
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

          // res.json({ error_code: 0, err_desc: null, data: result });
          for (var i = 0; i < result.length; i++) {
            // createuserfunc(result, i);
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
                  try {
                    fs.unlinkSync(req.file.path);
                  } catch (e) {
                    //error deleting the file
                  }
                  res.render("admin/excelsheet/allusersexist.ejs", {
                    user: req.user,
                  });
                }
              } else {
                const newUser = new User({
                  name,
                  email,
                  password,
                  regid,
                  position,
                  year,
                });

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
                          try {
                            fs.unlinkSync(req.file.path);
                          } catch (e) {
                            //error deleting the file
                          }
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
            // registration code complete
          }
        }
      );
    } catch (e) {
      res.json({ error_code: 1, err_desc: "Corupted excel file" });
    }
  });
});

router.get("/result", ensureAuthenticated, (req, res) => {
  if (req.user.email !== "admin@gmail.com") {
    res.render("404.ejs");
  }

  res.render("admin/excelsheet/result.ejs");
});

module.exports = router;
