import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCarViewEmail = async (userEmail, userName, carData) => {
  const carName = carData.name;
  const carPrice = `${carData.currency || "$"} ${carData.price.toLocaleString()}`;
  const carYear = carData.year;
  const carDescription = carData.shortDescription || carData.description.substring(0, 200);
  const carImage = carData.pictures && carData.pictures[0] ? carData.pictures[0] : "";
  const carLink = `${process.env.FRONTEND_URL}/cars/${carData.slug || carData._id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Continue Your Audi Journey</title>
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
        .header p {
          color: rgba(255, 255, 255, 0.8);
          margin: 8px 0 0;
          font-size: 14px;
        }
        .car-image {
          width: 100%;
          height: auto;
          background-color: #f9f9f9;
        }
        .car-image img {
          width: 100%;
          height: auto;
          object-fit: cover;
        }
        .content {
          padding: 32px 28px;
        }
        .car-title {
          font-size: 28px;
          font-weight: 700;
          color: #000000;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        .car-price {
          font-size: 24px;
          font-weight: 600;
          color: #000000;
          margin: 0 0 16px;
        }
        .car-year {
          display: inline-block;
          background-color: #f0f0f0;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
        }
        .description {
          color: #4a4a4a;
          line-height: 1.6;
          margin-bottom: 24px;
          font-size: 15px;
        }
        .specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin: 24px 0;
          padding: 20px 0;
          border-top: 1px solid #eaeaea;
          border-bottom: 1px solid #eaeaea;
        }
        .spec-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .spec-icon {
          width: 32px;
          height: 32px;
          background-color: #f5f5f5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .spec-label {
          font-size: 12px;
          color: #888;
          margin: 0;
        }
        .spec-value {
          font-size: 14px;
          font-weight: 600;
          color: #000;
          margin: 2px 0 0;
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
          margin: 8px 0;
          width: auto;
        }
        .cta-button:hover {
          background-color: #2c2c2c;
          transform: translateY(-2px);
        }
        .contact-section {
          background-color: #f9f9f9;
          padding: 24px 28px;
          text-align: center;
          border-radius: 16px;
          margin-top: 24px;
        }
        .contact-section p {
          margin: 0 0 12px;
          font-size: 14px;
          color: #4a4a4a;
        }
        .contact-button {
          display: inline-block;
          background-color: transparent;
          color: #000000;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 500;
          font-size: 14px;
          border: 1.5px solid #000000;
          transition: all 0.3s ease;
        }
        .contact-button:hover {
          background-color: #000000;
          color: #ffffff;
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
        .footer-links {
          margin-top: 16px;
        }
        .footer-links a {
          color: #888;
          text-decoration: none;
          font-size: 12px;
          margin: 0 12px;
        }
        @media (max-width: 600px) {
          .content {
            padding: 24px 20px;
          }
          .car-title {
            font-size: 24px;
          }
          .car-price {
            font-size: 20px;
          }
          .specs-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div class="container">
        <div class="header">
          <h1>Audi</h1>
          <p>Luxury Performance Redefined</p>
        </div>
        
        ${carImage ? `<div class="car-image"><img src="${carImage}" alt="${carName}"></div>` : ''}
        
        <div class="content">
          <h2 class="car-title">${carName}</h2>
          <div class="car-year">${carYear}</div>
          <div class="car-price">${carPrice}</div>
          <p class="description">${carDescription}...</p>
          
          <div class="specs-grid">
            <div class="spec-item">
              <div class="spec-icon">⚡</div>
              <div>
                <p class="spec-label">Performance</p>
                <p class="spec-value">Premium Engine</p>
              </div>
            </div>
            <div class="spec-item">
              <div class="spec-icon">🔧</div>
              <div>
                <p class="spec-label">Warranty</p>
                <p class="spec-value">${carData.warranty || '5 Years / 50,000 miles'}</p>
              </div>
            </div>
            <div class="spec-item">
              <div class="spec-icon">🚗</div>
              <div>
                <p class="spec-label">Condition</p>
                <p class="spec-value">${carData.condition || 'New'}</p>
              </div>
            </div>
            <div class="spec-item">
              <div class="spec-icon">⭐</div>
              <div>
                <p class="spec-label">Rating</p>
                <p class="spec-value">${carData.rating || '5.0'} (${carData.reviewCount || 0} reviews)</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${carLink}" class="cta-button">Continue Purchase →</a>
          </div>
          
          <div class="contact-section">
            <p>📞 Have questions about this vehicle?</p>
            <p style="font-size: 13px;">Our Audi specialists are ready to assist you with:</p>
            <p style="font-size: 13px;">• Test drive scheduling • Financing options • Trade-in value</p>
            <a href="tel:+18002834234" class="contact-button">Call Audi Support</a>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for considering Audi for your next vehicle.</p>
          <p style="font-size: 11px;">This email was sent because you viewed a vehicle on our platform.</p>
          <div class="footer-links">
            <a href="${process.env.FRONTEND_URL}/privacy">Privacy Policy</a>
            <a href="${process.env.FRONTEND_URL}/terms">Terms of Service</a>
            <a href="${process.env.FRONTEND_URL}/unsubscribe">Unsubscribe</a>
          </div>
          <p style="margin-top: 16px;">&copy; 2025 Audi. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Continue Your ${carName} Purchase Journey
    
    Hello ${userName || "Valued Customer"},
    
    Thank you for your interest in the ${carName} (${carYear}).
    
    Price: ${carPrice}
    
    Description: ${carDescription}
    
    To continue with your purchase or schedule a test drive, please visit:
    ${carLink}
    
    Key Specifications:
    - Condition: ${carData.condition || 'New'}
    - Warranty: ${carData.warranty || '5 Years / 50,000 miles'}
    - Rating: ${carData.rating || '5.0'}/5.0
    
    Our Audi specialists are ready to assist you with test drive scheduling, 
    financing options, and trade-in value assessment.
    
    For immediate assistance, call us at +1-800-AUDI-HELP
    
    Thank you for choosing Audi.
    
    Best regards,
    The Audi Team
  `;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `✨ Continue Your ${carName} Journey | Audi`,
      html: html,
      text: textContent,
    });
    
    console.log(`Car view email sent to ${userEmail} for ${carName}`);
  } catch (error) {
    console.error("Error sending car view email:", error);
    throw new Error("Failed to send car details email");
  }
};