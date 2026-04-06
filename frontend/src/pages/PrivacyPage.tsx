import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-blue-400 hover:underline text-sm mb-8 block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: April 5, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-white">1. Introduction</h2>
            <p>X Bot Trader ("we", "us", "our") is committed to protecting your privacy in compliance with Canada's Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable international privacy regulations. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at xbot-trader.vercel.app.</p>
            <p className="mt-2">This policy applies to all users who access our website, create an account, or use our services, including those who sign in via third-party authentication providers (Google, Microsoft, Facebook).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-gray-200 mt-4">Account Information</h3>
            <p>When you register, we collect your email address, username, and password. Your password is stored as a bcrypt hash — we never store or have access to your plaintext password.</p>

            <h3 className="text-lg font-semibold text-gray-200 mt-4">Social Login (OAuth)</h3>
            <p>If you sign in using Google, Microsoft, or Facebook, we receive:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your name and email address from the provider</li>
              <li>Your profile picture URL (Google, Facebook)</li>
              <li>A unique provider ID to link your account</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> receive or store your social account password. We do not post to your social accounts or access your contacts. You can disconnect social login at any time.</p>

            <h3 className="text-lg font-semibold text-gray-200 mt-4">Payment Information (Stripe)</h3>
            <p>Payment processing is handled entirely by <strong>Stripe, Inc.</strong> When you subscribe to a paid plan:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your credit card number, expiry date, and CVC are collected and processed by Stripe directly — <strong>we never see, store, or have access to your full card details</strong></li>
              <li>Stripe provides us with a customer ID, subscription status, and the last 4 digits of your card for display purposes only</li>
              <li>Stripe is PCI DSS Level 1 certified, the highest level of payment security certification</li>
              <li>For cryptocurrency payments, we receive only the transaction hash you submit</li>
            </ul>
            <p className="mt-2">Stripe's handling of your payment data is governed by <a href="https://stripe.com/privacy" className="text-blue-400 hover:underline" target="_blank" rel="noopener">Stripe's Privacy Policy</a>.</p>

            <h3 className="text-lg font-semibold text-gray-200 mt-4">Exchange API Keys</h3>
            <p>If you connect a cryptocurrency exchange:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>API keys are encrypted using AES-256-GCM encryption before storage</li>
              <li>Each key is encrypted with a unique nonce derived from your user ID</li>
              <li>We only request trade-level permissions — <strong>never withdrawal permissions</strong></li>
              <li>You can delete your API keys at any time from your Settings page</li>
              <li>Decrypted keys are only held in memory during trade execution and are never logged</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-200 mt-4">Telegram Integration</h3>
            <p>If you connect your Telegram account:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>We store your Telegram chat ID to send you notifications</li>
              <li>We do <strong>not</strong> access your Telegram messages, contacts, or profile beyond what you share via the bot</li>
              <li>You can disconnect Telegram at any time from Settings</li>
              <li>Notifications include trade alerts, price alerts, and bot status updates that you opt into</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-200 mt-4">AI Assistant</h3>
            <p>When you use the AI trading assistant:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your chat messages are sent to third-party AI providers (DeepSeek or Anthropic) for processing</li>
              <li>Messages include your username and conversation history for context</li>
              <li>We do not store AI conversation logs beyond the current session</li>
              <li>AI providers process your data according to their respective privacy policies</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-200 mt-4">Usage Data</h3>
            <p>We collect information about your interactions with the Service, including trading strategies created, trades executed (paper and live), bot configurations, and feature usage.</p>

            <h3 className="text-lg font-semibold text-gray-200 mt-4">Technical Data</h3>
            <p>We may collect IP addresses, browser type, device information, and access times for security purposes (e.g., login alerts) and service improvement.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>To provide, maintain, and improve the Service</li>
              <li>To process payments and manage subscriptions via Stripe</li>
              <li>To execute trading strategies on your behalf using your configured API keys</li>
              <li>To send account verification codes and security alerts</li>
              <li>To populate leaderboards (using usernames only — no personal data is exposed)</li>
              <li>To detect and prevent fraud, abuse, or unauthorized access</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. Data Sharing and Disclosure</h2>
            <p><strong>We do not sell, rent, or trade your personal information.</strong> We may share data with:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Stripe</strong> — for payment processing (PCI-compliant)</li>
              <li><strong>Resend</strong> — for transactional emails (verification codes, alerts)</li>
              <li><strong>Cryptocurrency exchanges</strong> — your encrypted API keys are decrypted and sent to execute trades you have configured</li>
              <li><strong>Law enforcement</strong> — only if required by valid legal process (court order, subpoena)</li>
              <li><strong>Google / Microsoft / Meta</strong> — if you use social login, authentication data is exchanged with these providers</li>
              <li><strong>Telegram</strong> — if you connect Telegram, we send notification messages via Telegram's Bot API</li>
              <li><strong>DeepSeek / Anthropic</strong> — AI assistant messages are processed by these providers</li>
              <li><strong>Railway / Vercel</strong> — our hosting providers, who process data as part of infrastructure operations</li>
            </ul>
            <p className="mt-2">Your leaderboard profile displays your username and trading performance only — no personal or financial information is exposed to other users.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Passwords hashed with bcrypt (one-way, irreversible)</li>
              <li>API keys encrypted with AES-256-GCM with unique per-user nonces</li>
              <li>All data transmitted over HTTPS/TLS encryption</li>
              <li>JWT-based authentication with short-lived access tokens</li>
              <li>Email verification on account creation</li>
              <li>Login alerts sent to your email for new sign-ins</li>
              <li>Database access restricted to application services only</li>
            </ul>
            <p className="mt-2">No method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. Data Retention</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Account data:</strong> retained while your account is active</li>
              <li><strong>Trading history:</strong> retained for the lifetime of your account for leaderboard and analytics</li>
              <li><strong>Payment records:</strong> retained as required by tax and financial regulations</li>
              <li><strong>Deleted accounts:</strong> personal data deleted within 30 days of account deletion, except where retention is required by law</li>
              <li><strong>API keys:</strong> immediately and permanently deleted when you remove them or delete your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. Your Rights Under PIPEDA</h2>
            <p>Under Canada's Personal Information Protection and Electronic Documents Act, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Access</strong> — request a copy of the personal information we hold about you</li>
              <li><strong>Correction</strong> — request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion</strong> — request deletion of your personal data</li>
              <li><strong>Withdraw consent</strong> — withdraw your consent for data processing at any time</li>
              <li><strong>Complaint</strong> — file a complaint with the Office of the Privacy Commissioner of Canada</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at <a href="mailto:xbottrader@gmail.com" className="text-blue-400 hover:underline">xbottrader@gmail.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">8. Cookies and Local Storage</h2>
            <p>We use browser local storage (not cookies) to maintain your authentication session (JWT tokens). We do not use third-party tracking cookies, advertising pixels, or analytics trackers. We do not share browsing data with any third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">9. International Data Transfers</h2>
            <p>Our servers are hosted in the United States (Railway, Vercel). Your data may be transferred to and processed in the United States. By using the Service, you consent to this transfer. We ensure that appropriate safeguards are in place to protect your data in compliance with PIPEDA.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">10. Children's Privacy</h2>
            <p>The Service is not intended for users under 18. We do not knowingly collect information from children under 18. If we discover such collection, we will delete the information immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email to registered users. Your continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">12. Contact</h2>
            <p>Privacy Officer: <a href="mailto:xbottrader@gmail.com" className="text-blue-400 hover:underline">xbottrader@gmail.com</a></p>
            <p>General inquiries: <a href="mailto:xbottrader@gmail.com" className="text-blue-400 hover:underline">xbottrader@gmail.com</a></p>
          </section>
        </div>

        <div className="mt-12 flex gap-4 text-sm">
          <Link to="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
          <Link to="/risk" className="text-blue-400 hover:underline">Risk Disclaimer</Link>
        </div>
      </div>
    </div>
  )
}
