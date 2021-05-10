// packages
const express = require("express");
const router = express.Router();
// Load Models
const User = require("../../../models/User");
const Form = require("../../../models/form");
const club = require("../../../models/club");
const clubHeadForm = require("../../../models/clubHeadForm");

// functionalities
const {
  ensureAuthenticated,
  forwardAuthenticated,
} = require("../../../config/auth");
const { sendEmail } = require("../../../common_functionalities/MailSender");
const { Console } = require("console");

// for authority user => submit rejected reason post route
router.post("/submitReasonClubHeads", async (req, res) => {
  if (req.user.position !== "Teacher") {
    res.render("404.ejs");
  }

  // finding that form and then updating the information of rejected message
  await clubHeadForm.findByIdAndUpdate(req.body.id, {
    rejectedmessage: req.body.message,
  });
  res.status(200).send();
});

// teacher side => club head forms => filtering included
router.get(
  "/teacherdashboard/:club/clubHeadForms/:filter",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      // data
      const filter = req.params.filter;
      const teacherName = req.user.name;
      const clubName = req.params.club;

      // fetching the club head form from database
      const allforms = await clubHeadForm.find({
        $and: [
          {
            teacherselected: teacherName,
          },
          {
            clubselected: clubName,
          },
        ],
      });

      // filtering for approved forms
      if (filter == "approved") {
        const approvedforms = allforms.filter((form) => {
          if (form.memberStatus === 1 || form.memberStatus === 2) {
            return true;
          } else return false;
        });

        // storing in approved forms array
        var approvedForms = [];
        for (var i = 0; i < approvedforms.length; i++) {
          var ownerName = await User.findById({
            _id: approvedforms[i].owner,
          });
          approvedForms.push({
            ...approvedforms[i]._doc,
            ownerName: ownerName.name,
          });
        }

        // rendering the page with details
        res.render("subadmin/teacherHeadRequest", {
          user: req.user,
          allforms: approvedForms,
          clubName: clubName,
        });
      }

      // filtering for pending forms
      if (filter == "pending") {
        const pendingforms = allforms.filter((form) => {
          if (form.memberStatus === 100 || form.memberStatus == 200) {
            return true;
          } else return false;
        });

        // storing in pending forms array
        var pendingForms = [];
        for (var i = 0; i < pendingforms.length; i++) {
          var ownerName = await User.findById({
            _id: pendingforms[i].owner,
          });
          pendingForms.push({
            ...pendingforms[i]._doc,
            ownerName: ownerName.name,
          });
        }

        // rendering
        res.render("subadmin/teacherHeadRequest", {
          user: req.user,
          allforms: pendingForms,
          clubName: clubName,
        });
      }

      // filtering for rejected forms
      if (filter == "rejected") {
        const rejectedforms = allforms.filter((form) => {
          if (form.memberStatus === -1 || form.memberStatus === -2) {
            return true;
          } else return false;
        });

        // storing in rejected forms array
        var rejectedForms = [];
        for (var i = 0; i < rejectedforms.length; i++) {
          var ownerName = await User.findById({
            _id: rejectedforms[i].owner,
          });
          rejectedForms.push({
            ...rejectedforms[i]._doc,
            ownerName: ownerName.name,
          });
        }

        // rendering page
        res.render("subadmin/teacherHeadRequest", {
          user: req.user,
          allforms: rejectedForms,
          clubName: clubName,
        });
      }

      // filtering for all types of forms
      if (filter == "all") {
        // storing all forms in the array so that we can pass it on to the frontend
        var allForms = [];
        for (var i = 0; i < allforms.length; i++) {
          var ownerName = await User.findById({
            _id: allforms[i].owner,
          });
          allForms.push({
            ...allforms[i]._doc,
            ownerName: ownerName.name,
          });
        }

        // rendering page with all forms
        res.render("subadmin/teacherHeadRequest", {
          user: req.user,
          allforms: allForms,
          clubName: clubName,
        });
      }
    } catch (e) {
      res.status(404);
      console.log("Error: ", e);
    }
  }
);

//authority user request visible to sub admin.
router.get(
  "/approveHeadReq/:id/approved",
  ensureAuthenticated,
  async (req, res) => {
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }
      const _id = req.params.id;
      // _id is of form selected

      // for update in clubHeadForm
      var clubName;
      var form3 = await clubHeadForm.findById(_id);
      var status = form3.memberStatus;

      //find the name of owner
      const owner = await User.findById(form3.owner);

      // checking the status of the user
      if (form3.clubposition == "Club Member") {
        status = 1;
      } else if (form3.clubposition == "Authority User") {
        status = 2;
      }

      // finding the club head form  and then updating it with teachers who have approved it
      form3 = await clubHeadForm.findByIdAndUpdate(
        _id,
        {
          $set: { memberStatus: status },
          $push: { teacherapproved: req.user.name },
        },
        { new: true, runValidators: true }
      );

      clubName = form3.clubselected;

      //for update in club collection
      var form2 = await club.findOne({
        clubName: clubName,
      });

      // checking status if club member
      if (form3.clubposition == "Club Member" && form3.memberStatus == 1) {
        form2 = await club.findOneAndUpdate(
          {
            clubName: clubName,
          },
          {
            $push: {
              members: owner.name,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        owner.clubs = owner.clubs.concat({ club: clubName });
        await owner.save();
      }

      // checking status if authority user

      if (form3.clubposition == "Authority User" && form3.memberStatus == 2) {
        form2 = await club.findOneAndUpdate(
          {
            clubName: clubName,
          },
          {
            $push: {
              clubHeads: owner.name,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
        owner.clubs = owner.clubs.concat({ club: clubName });
        owner.authClubs = owner.authClubs.concat({ authClub: clubName });
        await owner.save();
      }

      console.log(owner);

      //to send mail
      var email = owner.email;
      var emailbody =
        "You have now been authorised as authority user for  " +
        clubName.toString();
      sendEmail(email, "Authorised", emailbody);

      // rendering page
      res.render("subadmin/afterapproved.hbs", {
        redirectURL: `/teacherdashboard/${clubName}/clubHeadForms/pending`,
      });
    } catch (e) {
      res.status(500);
      console.log("Error : " + e);
    }
  }
);

// head request rejection
router.get(
  "/approveHeadReq/:id/rejected",
  ensureAuthenticated,
  async (req, res) => {
    const _id = req.params.id;
    try {
      if (req.user.position !== "Teacher") {
        res.render("404.ejs");
      }

      var clubName;

      // for update in clubHeadForm
      var form3 = await clubHeadForm.findByIdAndUpdate(_id);
      var status = form3.memberStatus;

      clubName = form3.clubselected;

      // when status is club member
      if (form3.clubposition == "Club Member") {
        status = -1;
      } else if (form3.clubposition == "Authority User") {
        status = -2;
      }

      // finding the club had form and then updating it
      form3 = await clubHeadForm.findByIdAndUpdate(
        _id,
        {
          $set: { memberStatus: status },
          $push: { teacherrejected: req.user.name },
        },
        { new: true, runValidators: true }
      );
    } catch (e) {
      res.status(404);
      console.log("Error : " + e);
    }

    // rendering the page
    res.render("subadmin/afterrejected.hbs", {
      formID: _id.toString(),
      redirectURL: `/teacherdashboard/${clubName}/clubHeadForms/pending`,
      submitReasonAt: "submitReasonClubHeads",
    });
  }
);

module.exports = router;
