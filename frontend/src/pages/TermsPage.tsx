import { Link } from 'react-router-dom'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-blue-400 hover:underline text-sm mb-8 block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: April 5, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-red-400 mt-0">IMPORTANT NOTICE</h2>
            <p className="text-red-300 mb-0">X Bot Trader is a <strong>software tool only</strong>. We do NOT provide investment advice, financial advice, trading recommendations, or asset management services. Your subscription pays for access to our software platform. All trading decisions and their outcomes are entirely your responsibility. Cryptocurrency trading carries significant risk of financial loss.</p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
            <p>By accessing or using X Bot Trader ("the Service"), operated by X Bot Trader ("we", "us", "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. Nature of the Service — SOFTWARE ACCESS ONLY</h2>
            <p><strong>X Bot Trader is a software-as-a-service (SaaS) platform that provides trading automation tools.</strong> Your subscription fee pays exclusively for access to our software, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Paper trading simulation with virtual funds</li>
              <li>Automated trading bot software tools</li>
              <li>Market data visualization and analysis tools</li>
              <li>Strategy leaderboard and social features</li>
              <li>AI-powered analysis assistant</li>
            </ul>
            <p className="mt-3"><strong>We are NOT:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>A registered investment advisor</li>
              <li>A broker-dealer or securities exchange</li>
              <li>A financial planner or financial advisor</li>
              <li>A portfolio manager or asset manager</li>
              <li>A money services business handling your funds</li>
            </ul>
            <p className="mt-3">We do not hold, custody, manage, or have access to withdraw your funds at any time. All funds remain in your personal exchange accounts (e.g., Coinbase) under your sole control.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. No Investment Advice</h2>
            <p><strong>Nothing on this platform constitutes investment advice, financial advice, trading advice, or any other sort of professional advice.</strong> The trading strategies, bot configurations, leaderboard rankings, AI assistant responses, and any other information provided through the Service are for informational and educational purposes only.</p>
            <p className="mt-2">You should consult a qualified financial advisor before making any investment decisions. We make no representation that any trading strategy will produce profits or avoid losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. Eligibility</h2>
            <p>You must be at least 18 years old and legally able to enter into contracts in your jurisdiction. By using the Service, you represent that you meet these requirements and that cryptocurrency trading is legal in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. Account Registration</h2>
            <p>You must provide accurate information when creating an account. You are solely responsible for maintaining the confidentiality of your credentials and for all activities under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. Subscription and Payments</h2>
            <p>The Service offers free and paid tiers. <strong>Paid subscriptions provide access to additional software features only.</strong> Subscriptions are billed monthly through Stripe or cryptocurrency payment.</p>
            <p className="mt-2"><strong>What you are paying for:</strong> Access to premium software features including additional bot strategy types, increased strategy limits, and live trading connectivity tools.</p>
            <p className="mt-2"><strong>What you are NOT paying for:</strong> Investment advice, guaranteed returns, portfolio management, or any financial service.</p>
            <p className="mt-2">You may cancel at any time through your account settings. Cancellation takes effect at the end of the current billing period.</p>
            <p className="mt-2"><strong>Refund Policy:</strong> If you are unsatisfied with the software within 30 days of your first paid subscription, contact us for a refund of your subscription fee. This applies to the subscription fee only and has no relation to any trading gains or losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. API Keys and Your Exchange Account</h2>
            <p>If you connect third-party exchange API keys, you do so at your own risk and discretion. We encrypt your API keys using AES-256-GCM encryption. We only request trade-level API access and <strong>never request or require withdrawal permissions</strong>.</p>
            <p className="mt-2">You acknowledge that:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You are granting our software permission to execute trades on your behalf based on the strategy parameters YOU configure</li>
              <li>You are solely responsible for the API permissions you grant</li>
              <li>You can revoke API access at any time through your exchange</li>
              <li>We are not liable for any trades executed by the software or any resulting gains or losses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">8. User Responsibilities</h2>
            <p>You acknowledge and agree that:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You are solely responsible for all trading decisions, including choosing strategies, setting parameters, and deciding to enable live trading</li>
              <li>You understand the risks of cryptocurrency trading</li>
              <li>You will not invest more than you can afford to lose</li>
              <li>You will comply with all applicable laws and tax obligations in your jurisdiction</li>
              <li>Paper trading results do not represent or guarantee live trading results</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">9. Prohibited Conduct</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Using the Service for any illegal purpose including market manipulation</li>
              <li>Attempting to manipulate leaderboards or trading data</li>
              <li>Reverse engineering or scraping the Service</li>
              <li>Sharing account credentials</li>
              <li>Misrepresenting the Service as providing investment advice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">10. Limitation of Liability</h2>
            <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, X BOT TRADER AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY TRADING LOSSES, LOST PROFITS, LOST DATA, OR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.</strong></p>
            <p className="mt-2">This includes but is not limited to losses caused by:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Bot strategy performance</li>
              <li>Market conditions or volatility</li>
              <li>Exchange outages or API failures</li>
              <li>Software bugs or downtime</li>
              <li>Delayed trade execution</li>
              <li>Any decision you make based on information from the Service</li>
            </ul>
            <p className="mt-2"><strong>Our total liability is limited to the amount you paid for the Service in the 12 months preceding any claim.</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">11. Indemnification</h2>
            <p>You agree to indemnify and hold harmless X Bot Trader and its operators from any claims, damages, or expenses arising from your use of the Service, your trading activities, or your violation of these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">12. Service Availability</h2>
            <p>We strive to maintain uptime but do not guarantee uninterrupted service. The Service may be temporarily unavailable for maintenance, updates, or due to circumstances beyond our control. We are not liable for any losses resulting from service interruptions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">13. Modifications</h2>
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification. Continued use constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">14. Governing Law</h2>
            <p>These Terms are governed by the laws of the Province of Ontario, Canada. Any disputes shall be resolved in the courts of Ontario.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">15. Contact</h2>
            <p>Questions: <a href="mailto:support@xbottrader.ca" className="text-blue-400 hover:underline">support@xbottrader.ca</a></p>
          </section>
        </div>

        <div className="mt-12 flex gap-4 text-sm">
          <Link to="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>
          <Link to="/risk" className="text-blue-400 hover:underline">Risk Disclaimer</Link>
        </div>
      </div>
    </div>
  )
}
