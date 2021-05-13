var nodemailer = require("nodemailer");
var random = require("random");

// nodemailer settings
var transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: "teamquickpermit@gmail.com",
    pass: process.env.QUICKPERMIT_GACCPASS,
  },
});

// forgot password function
// we will be getting the information from the route that calls this function
const forgotPassword = (email, subject, message) => {
  var mailOptions = {
    from: "teamquickpermit@gmail.com",
    to: email,
    subject: subject,
    text: message,
    html: `<h1>Hi there</h1><br><br> <div><p>Your OTP is ${otp}</p></div> <br/> <h2>Team Quick Permit</h2> `,
  };
};

// sending email settings
const sendEmail = (email, subject, message, name) => {
  name = name || "there";
  var mailOptions = {
    from: "teamquickpermit@gmail.com",
    to: email,
    subject: subject,
    html: `<h3>Hi ${name} !!!</h3> <br/>  ${message} <br/> <h3>Team Quick Permit</h3> `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
      return info.response;
    }
  });
};

// OTP function
const sendOtpEmail = (email) => {
  const otp = random.int((min = 1001), (max = 9999));

  // you can customize these
  var otpMailOptions = {
    from: "teamquickpermit@gmail.com",
    to: email,
    subject: "Reset Password from Quick Permit",
    html: `
    <div style="padding:50px;border:1px solid black">      
        <div><h2>Dear user,<br>As per your request, OTP for password reset is -  ${otp}</h2></div>
        <h4>Please Do Not share it with anyone</h4>
    
    </div>`,
  };

  // sending otp mail
  transporter.sendMail(otpMailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  return otp;
};

// export functions from the file
module.exports = {
  sendEmail,
  sendOtpEmail,
};
