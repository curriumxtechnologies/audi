import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to format USD price
const formatUSD = (amount) => {
  const numericAmount = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

// Helper to format crypto amount
const formatCrypto = (amount, coin = "USDT") => {
  const numericAmount = Number(amount || 0);
  return `${numericAmount.toLocaleString()} ${coin}`;
};

// Send payment confirmation email (for both initial submission and admin verification)
export const sendPaymentConfirmationEmail = async (
  userEmail,
  userName,
  car,
  amountPaid,
  currency = "USD",
  paymentPercentage,
  isFullPayment,
  remainingBalance,
  transactionId,
  paymentMethod = "USDT",
  paymentNetwork = "TRC20"
) => {
  const carName = car?.name || "your Audi";
  const carImage = car?.pictures?.[0] || "";
  const formattedAmountUSD = formatUSD(amountPaid);
  const formattedAmountCrypto = formatCrypto(amountPaid, paymentMethod);
  const formattedRemainingUSD = formatUSD(remainingBalance);
  const formattedRemainingCrypto = formatCrypto(remainingBalance, paymentMethod);
  
  const paymentType = isFullPayment ? "Full Payment" : "Part Payment";
  const subject = isFullPayment 
    ? `🎉 Congratulations! Your ${carName} is confirmed!`
    : `✅ Payment Received for ${carName} - ${paymentPercentage.toFixed(1)}% Complete`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 32px 28px;
        }
        .success-icon {
          text-align: center;
          font-size: 64px;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 24px;
          font-weight: 700;
          color: #000000;
          margin: 0 0 8px;
          text-align: center;
        }
        .payment-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 16px;
          padding: 24px;
          margin: 24px 0;
        }
        .payment-detail {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #dee2e6;
        }
        .payment-detail:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #495057;
        }
        .detail-value {
          font-weight: 700;
          color: #000000;
        }
        .progress-bar-container {
          background-color: #e9ecef;
          border-radius: 10px;
          height: 20px;
          overflow: hidden;
          margin: 20px 0;
        }
        .progress-bar {
          background: linear-gradient(90deg, #000000 0%, #2c2c2c 100%);
          height: 100%;
          border-radius: 10px;
          transition: width 0.5s ease;
          width: ${paymentPercentage}%;
        }
        .progress-text {
          text-align: center;
          font-size: 14px;
          margin-top: 8px;
          color: #6c757d;
        }
        .cta-button {
          display: inline-block;
          background-color: #000000;
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          transition: all 0.3s ease;
          margin: 16px 0;
          width: auto;
        }
        .cta-button:hover {
          background-color: #2c2c2c;
          transform: translateY(-2px);
        }
        .footer {
          background-color: #f5f5f5;
          padding: 24px 28px;
          text-align: center;
          border-top: 1px solid #eaeaea;
        }
        .footer p {
          font-size: 12px;
          color: #888;
          margin: 0 0 8px;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div class="container">
        <div class="header">
          <h1>Audi</h1>
        </div>
        
        <div class="content">
          <div class="success-icon">
            ${isFullPayment ? '🎉🏎️✨' : '✅💰'}
          </div>
          
          <h2>${isFullPayment ? 'Congratulations!' : 'Payment Received!'}</h2>
          <p style="text-align: center; color: #6c757d; margin-top: 8px;">
            ${isFullPayment 
              ? `You are now the proud owner of the ${carName}!` 
              : `Your payment for the ${carName} has been successfully received.`}
          </p>
          
          <div class="payment-card">
            <div class="payment-detail">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${transactionId}</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Payment Type:</span>
              <span class="detail-value">${paymentType}</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${paymentMethod} (${paymentNetwork})</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Amount Paid (USD):</span>
              <span class="detail-value">${formattedAmountUSD}</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Amount Paid (Crypto):</span>
              <span class="detail-value">${formattedAmountCrypto}</span>
            </div>
            ${!isFullPayment ? `
              <div class="payment-detail">
                <span class="detail-label">Remaining Balance (USD):</span>
                <span class="detail-value">${formattedRemainingUSD}</span>
              </div>
              <div class="payment-detail">
                <span class="detail-label">Remaining Balance (Crypto):</span>
                <span class="detail-value">${formattedRemainingCrypto}</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar"></div>
              </div>
              <div class="progress-text">
                ${paymentPercentage.toFixed(1)}% Complete
              </div>
            ` : ''}
          </div>
          
          ${!isFullPayment ? `
            <p style="text-align: center; margin: 20px 0;">
              Complete your payment to take delivery of your ${carName}.
            </p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/payment/${car?._id}" class="cta-button">
                Complete Payment →
              </a>
            </div>
          ` : `
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/orders.html" class="cta-button">
                View Your Order →
              </a>
            </div>
          `}
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Audi.</p>
          <p style="font-size: 11px;">For any questions, contact our support team at support@audi.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: subject,
      html: html,
    });
    console.log(`Payment confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
  }
};

// Send payment reminder email for incomplete payments
export const sendPaymentReminderEmail = async (
  userEmail,
  userName,
  car,
  amountPaid,
  remainingBalance,
  currency = "USD",
  transactionId,
  paymentId,
  paymentMethod = "USDT"
) => {
  const carName = car?.name || "your Audi";
  const formattedAmountPaidUSD = formatUSD(amountPaid);
  const formattedAmountPaidCrypto = formatCrypto(amountPaid, paymentMethod);
  const formattedRemainingUSD = formatUSD(remainingBalance);
  const formattedRemainingCrypto = formatCrypto(remainingBalance, paymentMethod);
  const paymentPercentage = (amountPaid / (amountPaid + remainingBalance)) * 100;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete Your Audi Purchase</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .header h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
        }
        .content {
          padding: 32px 28px;
        }
        .reminder-icon {
          text-align: center;
          font-size: 64px;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 24px;
          font-weight: 700;
          color: #000000;
          margin: 0 0 8px;
          text-align: center;
        }
        .payment-card {
          background: #fff3e0;
          border-left: 4px solid #ff9800;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .payment-detail {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #ffe0b2;
        }
        .payment-detail:last-child {
          border-bottom: none;
        }
        .detail-label {
          font-weight: 600;
          color: #e65100;
        }
        .detail-value {
          font-weight: 700;
          color: #000000;
        }
        .progress-bar-container {
          background-color: #e9ecef;
          border-radius: 10px;
          height: 20px;
          overflow: hidden;
          margin: 20px 0;
        }
        .progress-bar {
          background: linear-gradient(90deg, #ff9800 0%, #ffc107 100%);
          height: 100%;
          border-radius: 10px;
          width: ${paymentPercentage}%;
        }
        .cta-button {
          display: inline-block;
          background-color: #ff9800;
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          transition: all 0.3s ease;
          margin: 16px 0;
        }
        .cta-button:hover {
          background-color: #f57c00;
          transform: translateY(-2px);
        }
        .footer {
          background-color: #f5f5f5;
          padding: 24px 28px;
          text-align: center;
          border-top: 1px solid #eaeaea;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div class="container">
        <div class="header">
          <h1>Audi</h1>
        </div>
        
        <div class="content">
          <div class="reminder-icon">
            ⏰🏎️
          </div>
          
          <h2>Complete Your ${carName} Purchase</h2>
          <p style="text-align: center; color: #6c757d; margin-top: 8px;">
            Hello ${userName || "Valued Customer"}, your Audi is waiting for you!
          </p>
          
          <div class="payment-card">
            <div class="payment-detail">
              <span class="detail-label">Transaction ID:</span>
              <span class="detail-value">${transactionId}</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${paymentMethod}</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Amount Paid (USD):</span>
              <span class="detail-value">${formattedAmountPaidUSD}</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Amount Paid (Crypto):</span>
              <span class="detail-value">${formattedAmountPaidCrypto}</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Remaining Balance (USD):</span>
              <span class="detail-value">${formattedRemainingUSD}</span>
            </div>
            <div class="payment-detail">
              <span class="detail-label">Remaining Balance (Crypto):</span>
              <span class="detail-value">${formattedRemainingCrypto}</span>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar"></div>
            </div>
            <div class="progress-text" style="text-align: center; margin-top: 8px;">
              ${paymentPercentage.toFixed(1)}% Complete
            </div>
          </div>
          
          <p style="text-align: center; margin: 20px 0;">
            Don't let this opportunity pass! Complete your payment to secure your ${carName}.
          </p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/payment/${car?._id}" class="cta-button">
              Complete Payment Now →
            </a>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #6c757d; margin-top: 20px;">
            If you've already completed your payment, please ignore this reminder.
          </p>
        </div>
        
        <div class="footer">
          <p>Questions? Contact our support team at support@audi.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `⏰ Complete Your ${carName} Purchase - Payment Reminder`,
      html: html,
    });
    console.log(`Payment reminder email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending payment reminder email:", error);
  }
};

// Send payment failed email
export const sendPaymentFailedEmail = async (
  userEmail,
  userName,
  car,
  amountPaid,
  currency = "USD",
  transactionId,
  failureReason,
  paymentMethod = "USDT"
) => {
  const carName = car?.name || "your Audi";
  const formattedAmountUSD = formatUSD(amountPaid);
  const formattedAmountCrypto = formatCrypto(amountPaid, paymentMethod);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Issue - Audi</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .content {
          padding: 32px 28px;
        }
        .error-icon {
          text-align: center;
          font-size: 64px;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 24px;
          font-weight: 700;
          color: #d32f2f;
          margin: 0 0 8px;
          text-align: center;
        }
        .error-card {
          background: #ffebee;
          border-left: 4px solid #d32f2f;
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }
        .payment-detail {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #d32f2f;
          color: #ffffff !important;
          text-decoration: none;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          transition: all 0.3s ease;
          margin: 16px 0;
        }
        .cta-button:hover {
          background-color: #c62828;
          transform: translateY(-2px);
        }
        .footer {
          background-color: #f5f5f5;
          padding: 24px 28px;
          text-align: center;
          border-top: 1px solid #eaeaea;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div class="container">
        <div class="header">
          <h1>Audi</h1>
        </div>
        
        <div class="content">
          <div class="error-icon">
            ❌💰
          </div>
          
          <h2>Payment Verification Failed</h2>
          <p style="text-align: center; color: #6c757d; margin-top: 8px;">
            Hello ${userName || "Valued Customer"},
          </p>
          
          <div class="error-card">
            <div class="payment-detail">
              <strong>Transaction ID:</strong>
              <span>${transactionId}</span>
            </div>
            <div class="payment-detail">
              <strong>Amount (USD):</strong>
              <span>${formattedAmountUSD}</span>
            </div>
            <div class="payment-detail">
              <strong>Amount (Crypto):</strong>
              <span>${formattedAmountCrypto}</span>
            </div>
            <div class="payment-detail">
              <strong>Payment Method:</strong>
              <span>${paymentMethod}</span>
            </div>
            <div class="payment-detail">
              <strong>Issue:</strong>
              <span>${failureReason || "Payment verification failed"}</span>
            </div>
          </div>
          
          <p style="margin: 20px 0;">
            We couldn't verify your payment for the ${carName}. This could be due to:
          </p>
          <ul style="color: #6c757d;">
            <li>Incorrect transaction ID or receipt</li>
            <li>Insufficient funds</li>
            <li>Payment processing error</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/payment/${car?._id}" class="cta-button">
              Try Payment Again →
            </a>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #6c757d; margin-top: 20px;">
            Need assistance? Contact our support team at support@audi.com
          </p>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Audi.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `⚠️ Payment Issue for ${carName} - Action Required`,
      html: html,
    });
    console.log(`Payment failure email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending payment failure email:", error);
  }
};