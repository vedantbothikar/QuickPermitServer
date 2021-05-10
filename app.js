const express = require("express");
require("./db/mongoose");

const path = require("path");

//packages
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
var bodyParser = require("body-parser");
const hbs = require("hbs");
const ejs = require("ejs");
var compression = require("compression");

//models
const mongoose = require("mongoose");
const Form = require("./models/form");

//Rroutes
const formRouter = require("./routers/form/formRouter");
const studentRouter = require("./routers/student/studentRouter");

//subadmin routes
const subadminRouter = require("./routers/subadmin/subadminRouter");
const authorityUserRequestsRouter = require("./routers/subadmin/authorityUserRequests/authorityUserRequestsRouter");
const eventRequestsRouter = require("./routers/subadmin/eventRequests/eventRequestsRouter");
const leaveApplicationsRouter = require("./routers/subadmin/leaveApplications/leaveApplicationsRouter");

//admin routes
const adminRouter = require("./routers/admin/adminRouter");
const excelsheet = require("./routers/admin/excelsheet");
const reportsheet = require("./routers/admin/report/reportexcel");
const subadminRequestsRouter = require("./routers/admin/subadminRequests/subadminRequestsRouter");
const userAuthRequestsRouter = require("./routers/admin/userAuthRequests/userAuthRequestsRouter");

const app = express();
const port = process.env.PORT;

// Passport Config
require("./config/passport")(passport);

// setting directory paths
const publicDirectoryPath = path.join(__dirname, "./public");
const viewsPath = path.join(__dirname, "./templates/views/");

//  setting viewsPath  ejs hbs
app.set("view engine", "hbs");
app.set("view engine", "ejs");
app.set("views", viewsPath);
app.use(express.static(publicDirectoryPath));

//use compression
app.use(compression());

//body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

global.__basedir = __dirname;
console.log(__basedir);

// Routes
app.use("/", require("./routers/index.js"));
app.use("/loginActivity", require("./routers/LoginActivity.js"));

app.use(formRouter);
app.use(studentRouter);
app.use(adminRouter);
app.use(excelsheet);
app.use(reportsheet);
app.use(userAuthRequestsRouter);
app.use(subadminRequestsRouter);
app.use(subadminRouter);
app.use(authorityUserRequestsRouter);
app.use(eventRequestsRouter);
app.use(leaveApplicationsRouter);

// CORS handling for all request
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

//starting the server
app.listen(port, () => {
  console.log("Server listening on port ", port);
});
