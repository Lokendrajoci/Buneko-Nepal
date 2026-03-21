import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  Email credentials not configured. Email will not be sent.');
      return { success: false, message: 'Email not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: `"Buneko Blooms" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send account deactivation email
export const sendDeactivationEmail = async (user) => {
  const subject = 'Account Deactivated - Buneko Blooms';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Deactivated</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #d32f2f; margin-top: 0;">Account Deactivated</h1>
      </div>
      
      <div style="background-color: #fff; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
        <p>Dear ${user.name},</p>
        
        <p>We are writing to inform you that your account with Buneko Blooms has been deactivated by our administration team.</p>
        
        <p style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
          <strong>Important:</strong> You will no longer be able to access your account or make purchases until your account is reactivated.
        </p>
        
        <p>If you believe this is an error or have any questions, please contact our customer support team.</p>
        
        <p>Thank you for your understanding.</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Buneko Blooms Team</strong>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Account Deactivated - Buneko Blooms
    
    Dear ${user.name},
    
    We are writing to inform you that your account with Buneko Blooms has been deactivated by our administration team.
    
    Important: You will no longer be able to access your account or make purchases until your account is reactivated.
    
    If you believe this is an error or have any questions, please contact our customer support team.
    
    Thank you for your understanding.
    
    Best regards,
    Buneko Blooms Team
    
    ---
    This is an automated message. Please do not reply to this email.
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text,
  });
};

// Send account activation email
export const sendActivationEmail = async (user) => {
  const subject = 'Account Reactivated - Buneko Blooms';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Reactivated</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: #2e7d32; margin-top: 0;">Account Reactivated</h1>
      </div>
      
      <div style="background-color: #fff; padding: 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
        <p>Dear ${user.name},</p>
        
        <p>Great news! Your account with Buneko Blooms has been reactivated.</p>
        
        <p style="background-color: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
          <strong>Welcome back!</strong> You can now access your account and continue shopping with us.
        </p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our customer support team.</p>
        
        <p>Thank you for being a valued customer.</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Buneko Blooms Team</strong>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
    Account Reactivated - Buneko Blooms
    
    Dear ${user.name},
    
    Great news! Your account with Buneko Blooms has been reactivated.
    
    Welcome back! You can now access your account and continue shopping with us.
    
    If you have any questions or need assistance, please don't hesitate to contact our customer support team.
    
    Thank you for being a valued customer.
    
    Best regards,
    Buneko Blooms Team
    
    ---
    This is an automated message. Please do not reply to this email.
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text,
  });
};

