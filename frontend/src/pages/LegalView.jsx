import React from 'react';

export default function LegalView({ page = 'terms' }) {
  return (
    <section id={`${page}-view`} className="view-container active">
      <button className="legal-back-btn" onClick={() => window.history.back()}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </button>

      {/* Quick nav between legal pages */}
      <div className="legal-nav-pills">
        <button 
          className={`legal-nav-pill ${page === 'terms' ? 'active' : ''}`} 
          onClick={() => window.location.hash = '#/terms'}
        >
          📄 Terms &amp; Conditions
        </button>
        <button 
          className={`legal-nav-pill ${page === 'privacy' ? 'active' : ''}`} 
          onClick={() => window.location.hash = '#/privacy'}
        >
          🔒 Privacy Policy
        </button>
      </div>

      {page === 'terms' ? (
        <>
          {/* Header */}
          <div className="legal-header">
            <span className="legal-header-icon">📄</span>
            <h1>Terms &amp; Conditions</h1>
            <span className="legal-header-date">Last Updated: June 2026</span>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">1. Introduction</div>
            <div className="legal-text">
              <p>ScholarMart is a student-focused marketplace platform that connects student vendors with buyers within campus communities. By using ScholarMart, you agree to these terms.</p>
              <p><strong>1.1 Eligibility</strong><br />You must be at least 18 years old to use ScholarMart. If you are under 18, you must have parental/guardian consent. By using this platform, you confirm you are eligible.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">2. Our Role</div>
            <div className="legal-text">
              <p>ScholarMart is <strong>not</strong> the seller of goods or services. We only:</p>
              <ul>
                <li>Help vendors list their products</li>
                <li>Help students discover and contact vendors</li>
              </ul>
              <p>We do not process payments or guarantee transactions between users.</p>
              <p>ScholarMart is an independent platform not affiliated with any university or educational institution.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">3. Vendor Responsibility</div>
            <div className="legal-text">
              <p>All vendors must:</p>
              <ul>
                <li>Provide accurate product descriptions and pricing</li>
                <li>Only sell legal and allowed items</li>
                <li>Deliver what they advertise</li>
                <li>Respond to customers in good faith</li>
              </ul>
              <p>ScholarMart reserves the right to remove any vendor who provides false information or engages in misconduct.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">4. Prohibited Items</div>
            <div className="legal-text">
              <p>Vendors are <strong>not</strong> allowed to list:</p>
              <ul>
                <li>Illegal drugs or substances</li>
                <li>Weapons or harmful items</li>
                <li>Counterfeit or pirated products</li>
                <li>Fraudulent or misleading services</li>
                <li>Stolen goods</li>
                <li>Any item prohibited by school or Nigerian law</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">5. User Responsibility</div>
            <div className="legal-text">
              <p>Buyers are responsible for:</p>
              <ul>
                <li>Verifying product details before purchase</li>
                <li>Communicating clearly with vendors</li>
                <li>Completing transactions directly with vendors</li>
                <li>Meeting in public places for safety</li>
              </ul>
              <p><strong>5.1 Content Moderation</strong><br />We aim to review reported listings within 24–48 hours. We reserve the right to remove listings that violate these terms. We may suspend accounts pending investigation.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">6. Limitation of Liability</div>
            <div className="legal-highlight-box">
              <div className="legal-text">
                <p>TO THE FULLEST EXTENT PERMITTED BY LAW:</p>
              </div>
            </div>
            <div className="legal-text">
              <p><strong>6.1</strong> ScholarMart is provided "AS IS" without any warranties.</p>
              <p><strong>6.2</strong> ScholarMart is <strong>NOT</strong> responsible for:</p>
              <ul>
                <li>Any transaction between users</li>
                <li>Product quality, authenticity, or delivery</li>
                <li>Any financial loss, damage, or injury</li>
                <li>Any vendor misrepresentation or fraud</li>
                <li>Any disputes between users</li>
              </ul>
              <p><strong>6.3</strong> Users interact and transact at their own risk. ScholarMart does NOT guarantee any transaction will be completed.</p>
              <p><strong>6.4</strong> Total liability to any user shall not exceed ₦10,000.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">7. Indemnification</div>
            <div className="legal-text">
              <p>You agree to protect and hold ScholarMart harmless from:</p>
              <ul>
                <li>Any claims arising from your use of the platform</li>
                <li>Any disputes with other users</li>
                <li>Any violation of these terms</li>
                <li>Any harm caused by your products or actions</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">8. Account Removal</div>
            <div className="legal-text">
              <p>We may suspend or remove any vendor or user who:</p>
              <ul>
                <li>Breaks these rules</li>
                <li>Engages in fraud or spam</li>
                <li>Harms platform trust or users</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">9. Updates</div>
            <div className="legal-text">
              <p>We may update these terms at any time. Continued use means you accept changes.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">10. Governing Law</div>
            <div className="legal-text">
              <p>These terms are governed by the laws of <strong>Nigeria</strong>. Any disputes shall be resolved in Nigerian courts.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">11. Force Majeure</div>
            <div className="legal-text">
              <p>We are not liable for any failure or delay caused by: natural disasters, government actions, internet outages, or any event beyond our reasonable control.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">12. Contact</div>
            <div className="legal-contact-box">
              <div className="legal-contact-item">📧 contact@scholarmart.com</div>
              <div className="legal-contact-item">📱 WhatsApp: 07014109517</div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <div className="legal-header" style={{ background: 'var(--gradient-legal-header)' }}>
            <span className="legal-header-icon">🔒</span>
            <h1>Privacy Policy</h1>
            <span className="legal-header-date">Last Updated: June 2026</span>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">1. Information We Collect</div>
            <div className="legal-text">
              <p>We may collect:</p>
              <ul>
                <li>Full Name</li>
                <li>Email Address</li>
                <li>WhatsApp Number</li>
                <li>University &amp; Campus</li>
                <li>Product listings and images</li>
                <li>Communication details with vendors</li>
              </ul>
              <p><strong>1.1 Legal Basis for Collecting Data</strong></p>
              <p>We collect your data based on:</p>
              <ul>
                <li>Your consent (you agree when you sign up)</li>
                <li>Contractual necessity (to connect you with buyers/sellers)</li>
                <li>Legitimate interest (to improve the platform)</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">2. How We Use Information</div>
            <div className="legal-text">
              <p>We use your data to:</p>
              <ul>
                <li>Connect buyers with vendors</li>
                <li>Display product listings</li>
                <li>Manage vendor accounts</li>
                <li>Improve platform experience</li>
                <li>Send important updates (optional)</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">3. Data Sharing</div>
            <div className="legal-text">
              <p>We <strong>do not sell</strong> personal data.</p>
              <p>We only share information:</p>
              <ul>
                <li>Between buyers and vendors (as needed for transactions)</li>
                <li>When required by law or school authorities</li>
              </ul>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">4. Data Protection</div>
            <div className="legal-text">
              <p><strong>4.1 Security Measures</strong></p>
              <p>We implement security measures including:</p>
              <ul>
                <li>Password encryption (hashing)</li>
                <li>Secure server hosting</li>
                <li>Access controls for admins</li>
              </ul>
              <p>However, no method is 100% secure. We cannot guarantee security for external communications like WhatsApp.</p>
              <p><strong>4.2 Data Retention</strong></p>
              <p>We keep your data as long as: you have an active account, we need it to provide service, or it is required by law. You can request deletion at any time.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">5. Third-Party Communication</div>
            <div className="legal-text">
              <p>Transactions happen directly between users (often via WhatsApp or phone). ScholarMart is not responsible for third-party handling of data or payments.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">6. Your Rights</div>
            <div className="legal-text">
              <p><strong>6.1 Your Rights Under NDPA 2023</strong></p>
              <p>You have the right to:</p>
              <ul>
                <li>Access your data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data</li>
                <li>Object to processing</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p>To exercise these rights, contact us at <strong>privacy@scholarmart.com</strong>. We will respond within 30 days.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">7. Cookies</div>
            <div className="legal-text">
              <p>ScholarMart may use cookies to:</p>
              <ul>
                <li>Improve user experience</li>
                <li>Remember login sessions</li>
                <li>Analyze platform usage</li>
              </ul>
              <p>You can disable cookies in your browser settings.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">8. Data Controller</div>
            <div className="legal-text">
              <p>ScholarMart is the data controller for your personal data. Contact us at:</p>
            </div>
            <div className="legal-contact-box">
              <div className="legal-contact-item">📧 privacy@scholarmart.com</div>
              <div className="legal-contact-item">📱 WhatsApp: 07014109517</div>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">9. Updates</div>
            <div className="legal-text">
              <p>We may update this policy at any time. Continued use means you accept changes.</p>
            </div>
          </div>

          <div className="legal-section">
            <div className="legal-section-title">10. Contact</div>
            <div className="legal-text">
              <p>For questions or requests:</p>
            </div>
            <div className="legal-contact-box">
              <div className="legal-contact-item">📧 privacy@scholarmart.com</div>
              <div className="legal-contact-item">📱 WhatsApp: 07014109517</div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
