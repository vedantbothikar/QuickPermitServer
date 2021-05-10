const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../../config/auth");

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

router.post("/uploadreport", function (req, res) {
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

          const totalRegistrations = result.length;
          const techeventscount = {};
          const nontecheventscount = {};
          const collegecount = {};
          const yearcount = {};
          const winnersdata = {};

          result.forEach((element) => {
            element.techevents = element.techevents.split(",");
            element.winnerarray = element.winner.split(",");
            element.runneruparray = element.runnerup.split(",");

            element.winnerarray.forEach((myevent) => {
              if (myevent == "") {
                console.log("nothing");
              } else {
                winnersdata[myevent] = {};
                winnersdata[myevent].Winner = element.name;
              }
            });

            element.runneruparray.forEach((myevent) => {
              if (myevent == "") {
                console.log("nothing");
              } else {
                if (winnersdata[myevent]) {
                  console.log("heheh");
                  winnersdata[myevent].Runnerup = element.name;
                } else {
                  console.log(winnersdata[myevent]);
                }
              }
            });

            if (yearcount[element.year]) {
              yearcount[element.year] = yearcount[element.year] + 1;
            } else {
              yearcount[element.year] = 1;
            }

            if (collegecount[element.college]) {
              collegecount[element.college] = collegecount[element.college] + 1;
            } else {
              collegecount[element.college] = 1;
            }

            element.techevents.forEach((subevent) => {
              if (subevent == "") {
                console.log("nothing");
              } else {
                if (techeventscount[subevent]) {
                  techeventscount[subevent] = techeventscount[subevent] + 1;
                } else {
                  techeventscount[subevent] = 1;
                }
              }
            });

            element.nontechevents = element.nontechevents.split(",");
            element.nontechevents.forEach((subevent) => {
              if (subevent == "") {
                console.log("nothing");
              } else {
                if (nontecheventscount[subevent]) {
                  nontecheventscount[subevent] =
                    nontecheventscount[subevent] + 1;
                } else {
                  nontecheventscount[subevent] = 1;
                }
              }
            });
          });

          console.log("winnersdata");
          console.log(winnersdata);

          console.log("yearcount");
          console.log(yearcount);

          console.log("collegecount");
          console.log(collegecount);

          console.log("nontecheventscount");
          console.log(nontecheventscount);

          console.log("techeventscount");
          console.log(techeventscount);

          res.render("admin/report/report.ejs", {
            winnersdata,
            yearcount,
            collegecount,
            nontecheventscount,
            techeventscount,
          });
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
