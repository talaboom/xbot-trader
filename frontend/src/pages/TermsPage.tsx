import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-blue-400 hover:underline text-sm mb-8 block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: April 3, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p>By accessing or using X Bot Trader ("the Service"), operated by X Bot Trader ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. Description of Service</h2>
            <p>X Bot Trader provides an AI-powered cryptocurrency paper trading and simulation platform. The Service includes:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Paper trading with virtual funds using real market data</li>
              <li>AI-powered trading bot strategies</li>
              <li>Strategy leaderboards and copy trading features</li>
              <li>AI trading assistant</li>
              <li>Live market data and analysis tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. Eligibility</h2>
            <p>You must be at least 18 years old and legally able to enter into contracts in your jurisdiction. By using the Service, you represent and warrant that you meet these requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. Account Registration</h2>
            <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account. Notify us immediately of any unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. Subscription and Payments</h2>
            <p>The Service offers free and paid subscription tiers. Paid subscriptions are billed monthly through Stripe. By subscribing, you authorize us to charge your payment method on a recurring basis.</p>
            <p className="mt-2">You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period. No prorated refunds are issued for partial months.</p>
            <p className="mt-2"><strong>Money-Back Guarantee:</strong> If you are unsatisfied with the Service within your first 30 days of a paid subscription, contact us for a full refund of your subscription fee. This guarantee applies to the subscription fee only, not to any trading losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. No Financial Advice</h2>
            <p><strong>X Bot Trader is NOT a financial advisor.</strong> The Service provides tools and simulations for educational and informational purposes only. Nothing on the Service constitutes financial, investment, legal, or tax advice. You are solely responsible for your own trading and investment decisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. Risk Disclaimer</h2>
            <p>Cryptocurrency trading involves substantial risk of loss. Past performance of any trading strategy, bot, or simulation does not guarantee future results. Paper trading results do not reflect actual trading conditions including liquidity, slippage, and fees.</p>
            <p className="mt-2">You acknowledge that you may lose some or all of your invested capital if you choose to engage in live trading. We are not liable for any trading losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">8. API Keys and Third-Party Services</h2>
            <p>If you connect third-party exchange API keys (e.g., Coinbase), you do so at your own risk. We encrypt your API keys using AES-256 encryption and never request withdrawal permissions. However, we are not liable for any unauthorized access to your exchange accounts.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">9. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to manipulate leaderboards or trading data</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Share your account credentials with others</li>
              <li>Use automated tools to scrape or access the Service beyond normal use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, X Bot Trader and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or trading losses, arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">11. Modifications</h2>
            <p>We reserve the right to modify these Terms at any time. We will notify users of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the modified Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">12. Governing Law</h2>
            <p>These Terms are governed by the laws of the Province of Ontario, Canada. Any disputes shall be resolved in the courts of Ontario.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">13. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:support@xbottrader.shop" className="text-blue-400 hover:underline">support@xbottrader.shop</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
