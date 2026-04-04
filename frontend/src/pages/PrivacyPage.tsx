import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-blue-400 hover:underline text-sm mb-8 block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: April 3, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-white">1. Introduction</h2>
            <p>X Bot Trader ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform at xbottrader.shop.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. Information We Collect</h2>
            <p><strong>Account Information:</strong> When you register, we collect your email address, username, and password (stored as a bcrypt hash — we never store your plaintext password).</p>
            <p className="mt-2"><strong>Payment Information:</strong> Payment processing is handled by Stripe. We do not store your credit card numbers. Stripe's privacy policy governs the handling of payment data.</p>
            <p className="mt-2"><strong>Exchange API Keys:</strong> If you connect a cryptocurrency exchange, we store your API keys encrypted with AES-256-GCM encryption. We only request trade permissions — never withdrawal permissions.</p>
            <p className="mt-2"><strong>Usage Data:</strong> We collect information about your interactions with the Service, including trading strategies created, trades executed (paper and live), and feature usage.</p>
            <p className="mt-2"><strong>Technical Data:</strong> We may collect IP addresses, browser type, device information, and access times for security and analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>To provide and maintain the Service</li>
              <li>To process payments and manage subscriptions</li>
              <li>To execute trading strategies on your behalf</li>
              <li>To populate leaderboards and copy trading features (using usernames only)</li>
              <li>To send service-related communications</li>
              <li>To improve and optimize the Service</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. Data Sharing</h2>
            <p>We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Stripe:</strong> For payment processing</li>
              <li><strong>Cryptocurrency exchanges:</strong> Your API keys are sent to exchanges to execute trades on your behalf</li>
              <li><strong>Law enforcement:</strong> If required by law or court order</li>
            </ul>
            <p className="mt-2">Your trading performance on leaderboards is displayed using your username only — no personal or financial information is exposed.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Passwords are hashed using bcrypt</li>
              <li>API keys are encrypted with AES-256-GCM</li>
              <li>All data transmitted over HTTPS/TLS</li>
              <li>Database access restricted to application services only</li>
            </ul>
            <p className="mt-2">No method of transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.</p>
            <p className="mt-2">Trading history may be retained in anonymized form for leaderboard and analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. Your Rights (PIPEDA Compliance)</h2>
            <p>Under Canada's Personal Information Protection and Electronic Documents Act (PIPEDA), you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>File a complaint with the Privacy Commissioner of Canada</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">8. Cookies</h2>
            <p>We use local storage (not cookies) to maintain your authentication session. We do not use third-party tracking cookies. Analytics, if implemented, will use privacy-respecting tools.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">9. Children's Privacy</h2>
            <p>The Service is not intended for users under 18. We do not knowingly collect information from children under 18. If we become aware of such collection, we will delete the information immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify users of material changes via email. Your continued use of the Service constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">11. Contact</h2>
            <p>For privacy-related inquiries or to exercise your rights, contact us at: <a href="mailto:privacy@xbottrader.shop" className="text-blue-400 hover:underline">privacy@xbottrader.shop</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
