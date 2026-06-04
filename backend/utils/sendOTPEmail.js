import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOTPEmail = async (email, otp, purpose) => {
  let subject = "";
  let html = "";

  switch (purpose) {
    case "registration":
      subject = "Verify Your Email";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome!</h2>
          <p>Thank you for registering. Please verify your email address using the OTP below:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;
      break;
    case "login":
      subject = "Login Verification OTP";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Login Verification</h2>
          <p>Your login verification OTP is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't try to login, please ignore this email.</p>
        </div>
      `;
      break;
    case "password_reset":
      subject = "Password Reset OTP";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Use the OTP below:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;
      break;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      html: html,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP email");
  }
};

export const sendLoginAlertEmail = async (email, name) => {
  const resetLink = `${process.env.FRONTEND_URL}/verify-login-alert?email=${email}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #d9534f;">⚠️ Suspicious Login Attempt</h2>
      <p>Hello ${name || "User"},</p>
      <p>We noticed multiple failed login attempts to your account. If this wasn't you, please take action immediately.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p style="margin: 10px 0 0;"><strong>Action Required:</strong> Click the button below to secure your account.</p>
      </div>
      <a href="${resetLink}" style="display: inline-block; background-color: #d9534f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Secure Your Account →</a>
      <p style="margin-top: 20px; font-size: 12px; color: #777;">If you didn't attempt to login, someone else might be trying to access your account.</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 12px; color: #777;">If the button doesn't work, copy and paste this link: ${resetLink}</p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "⚠️ Security Alert: Multiple Failed Login Attempts",
      html: html,
    });
  } catch (error) {
    console.error("Error sending login alert email:", error);
  }
};