import User from "@/models/user-model";
import crypto from "crypto";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const sendEmail = async ({ 
  email, 
  emailType, 
  userId 
} : {
  email: string;
  emailType: 'VERIFY' | 'RESET';
  userId: string | mongoose.Types.ObjectId;
}): Promise<SMTPTransport.SentMessageInfo> => {
  try {
    // generate a cryptographically random raw token (32 bytes → 64-char hex string)
    const rawToken: string = crypto.randomBytes(32).toString("hex");

    // hash with SHA-256 for DB storage (deterministic, fast, secure for high-entropy tokens)
    const hashedToken: string = crypto.createHash("sha256").update(rawToken).digest("hex");

    // set data based on emailType
    let route: string = "verifyemail";
    let action: string = "Verify your email";
    let userUpdate: object = {
      verifyToken: hashedToken,  // only the hash goes in the DB                
      verifyTokenExpiry: Date.now() + (1000 * 60 * 60), // 1 hour
    };

    if (emailType === "RESET") {
      route = "resetpassword";
      action = "Reset your password";
      userUpdate = {
        forgotPasswordToken: hashedToken,  // only the hash goes in the DB
        forgotPasswordTokenExpiry: Date.now() + (1000 * 60 * 60), // 1 hour
      };
    }

    // update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId.toString(), 
      userUpdate,
      {
        new: true,
        runValidators: true,
      }
    );

    // throw if no user found
    if (!updatedUser) {
      throw new Error("User not found");
    }

    // throw if smtp env variables are not configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT);
    const smtpUser = process.env.MAILER_USER;
    const smtpPass = process.env.MAILER_PASS;
    const mailFrom = process.env.MAILER_FROM;
    const domain = process.env.DOMAIN;
    if (
      !smtpHost ||
      !Number.isInteger(smtpPort) ||
      smtpPort < 1 ||
      smtpPort > 65535 ||
      !smtpUser ||
      !smtpPass ||
      !mailFrom ||
      !domain
    ) {
      throw new Error(
        "Missing or invalid mail configuration (SMTP_HOST, SMTP_PORT, MAILER_USER, MAILER_PASS, MAILER_FROM, DOMAIN)"
      );
    }

    // configure transport
    const transport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      }
    });

    // expose only the raw token in the url
    const verificationUrl = `${domain}/${route}?token=${encodeURIComponent(rawToken)}`;

    // configure mail options
    const mailOptions = {
      from: mailFrom,
      to: email,
      subject: action,
      html: `<p>Click <a href="${verificationUrl}">here</a> to ${action.toLowerCase()}</p>`,
    };

    // send the email and return the transport response
    const mailResponse:SMTPTransport.SentMessageInfo = await transport.sendMail(mailOptions);
    return mailResponse;
    
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error sending email";
    throw new Error(message, { cause: error });
  }
}