// packages
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");

// Loading models
const clubHeadForm = require("../models/clubHeadForm");
const User = require("../models/User");
const Form = require("../models/form");

// functionalities
const {
  sendOtpEmail,
  sendEmail,
} = require("../common_functionalities/MailSender");
const { forwardAuthenticated, ensureAuthenticated } = require("../config/auth");

// Login Page route
router.get("/login", forwardAuthenticated, async (req, res) =>
  res.render("home/login")
);

// forgot password route
router.get("/forgotpassword", (req, res) => res.render("home/forgotpassword"));

// setting new password route
router.get("/newpassword/:id", async (req, res) => {
  var id = req.params.id;
  id = id.toString();
  `  `;

  console.log(req.user);

  res.render("home/newpassword", { id });
});

// Redirecting route
router.post("/loginPageAfterForgotPassword", async (req, res) => {
  try {
    // requiring data
    var id = req.body.id;
    var password = req.body.password;

    // password hashing code using bcryptjs
    bcrypt.genSalt(10, async (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) throw err;
        password = hash;
        const doc = await User.findOneAndUpdate(
          {
            _id: id,
          },
          {
            password,
          }
        );
        if (doc) {
          // on success
          res.json({
            status: "success",
          });
          return null;
        } else {
          // on failure
          res.json({
            status: "error",
          });
          return null;
        }
      });
    });
  } catch (e) {
    res.status(404);
    console.log("Error: ", e);
  }
});

// verifying email route
router.post("/verifyingEmail", async (req, res) => {
  // data
  var email = req.body.email;

  // checking if the user with email exists -> if yes send an OTP
  User.find({
    email,
  }).then((exists) => {
    if (exists.length == 1) {
      var otp = sendOtpEmail(email);

      res.json({
        status: "success",
        otp,
        object_id: exists[0]._id,
      });
      return null;
    } else {
      console.log("error");
      res.json({
        status: "error",
      });
      return null;
    }
  });
});

// Register Page
router.get("/register", async (req, res) => res.render("home/register"));

// post request for Register
router.post("/register", (req, res) => {
  const { name, email, password, password2, regid, position, year } = req.body;
  let errors = [];

  // in case any data is missing
  if (!name || !email || !password || !password2) {
    errors.push({
      msg: "Please enter all fields",
    });
  }

  // case - passwords don't match
  if (password != password2) {
    errors.push({
      msg: "Passwords do not match",
    });
    res.render("home/register", {
      errors,
      name,
      email,
      password,
      password2,
      regid,
    });
  }

  // proper validation for password
  if (password.length < 6) {
    errors.push({
      msg: "Password must be at least 6 characters",
    });
  }

  // case - errors exist - render the same page again
  if (errors.length > 0) {
    res.render("home/register", {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    // case - no errors

    //checking if such user already exists
    User.findOne({
      $or: [{ email: email }, { regid: regid.toLowerCase() }],
    }).then((user) => {
      if (user) {
        //if the user exists - send an error message
        errors.push({
          msg: "Email or Registration ID already exists",
        });

        // rendering the same register page due to error
        res.render("home/register", {
          errors,
          name,
          email,
          password,
          password2,
          regid,
        });
      } else {
        // case - everything is fine
        // create new user with the given details
        const newUser = new User({
          name,
          email,
          password,
          regid,
          position,
          year,
        });

        // sending email describing their account approval will be done soon by the admin
        sendEmail(
          email,
          "Account creation request",
          "Congratulations !! Your request to create an account on QUICK PERMIT was successfully sent to admin. Your account will be approved soon..."
        );

        // hashing the password
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then((user) => {
                // sending falsh message and redirecting to login page
                req.flash("success_msg", "Registration request sent");
                res.redirect("/loginActivity/login");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
});

// Login route
router.post("/login", async (req, res, next) => {
  // special cae of if the user has admin status
  if (req.body.email == "admin@gmail.com") {
    passport.authenticate("local", {
      successRedirect: "/admindashboard",
      failureRedirect: "/loginActivity/login",
      failureFlash: true,
    })(req, res, next);
  } else {
    // for other type of users

    // check if any user exists with the given credentials
    const user = await User.findOne({ email: req.body.email });
    if (user && user.position === "Teacher") {
      passport.authenticate("local", {
        successRedirect: "/teacherdashboard",
        failureRedirect: "/loginActivity/login",
        failureFlash: true,
      })(req, res, next);
    } else {
      // authentication code
      passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/loginActivity/login",
        failureFlash: true,
      })(req, res, next);
    }
  }
});

// Logout route
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/loginActivity/login");
});

// password change page route
router.get("/passwordchange", forwardAuthenticated, (req, res) => {
  res.render("home/passwordchange.hbs");
});

module.exports = router;
