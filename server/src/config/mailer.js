const nodemailer = require("nodemailer");

const smtpHost = process.env.EMAIL_HOST || process.env.VERIFICATION_EMAIL_HOST;
const smtpPort = Number(
  process.env.EMAIL_PORT || process.env.VERIFICATION_EMAIL_PORT || 587
);
const smtpUser = process.env.EMAIL_USER || process.env.VERIFICATION_EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS || process.env.VERIFICATION_EMAIL_PASS;
const smtpFrom = process.env.EMAIL_FROM || process.env.VERIFICATION_EMAIL_FROM;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
  });
};

module.exports = { sendMail };
