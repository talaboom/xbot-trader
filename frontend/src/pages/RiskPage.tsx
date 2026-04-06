import { Link } from 'react-router-dom'

export default function RiskPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-blue-400 hover:underline text-sm mb-8 block">&larr; Back to Home</Link>
        <h1 className="text-3xl font-bold text-white mb-2">Risk Disclaimer</h1>
        <p className="text-gray-400 mb-8">Last updated: April 3, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-300">

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-red-400 mt-0">HIGH RISK WARNING</h2>
            <p className="text-red-300 mb-0">Cryptocurrency trading involves substantial risk of loss and is not suitable for every investor. You could lose some or all of your invested capital. Do not invest money you cannot afford to lose. X Bot Trader is software — not a financial advisor, broker, or money manager.</p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-white">1. Cryptocurrency Trading Risks</h2>
            <p>Trading cryptocurrencies carries a high level of risk due to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Extreme volatility</strong> — Cryptocurrency prices can swing 10-50% or more in a single day. Assets can lose most or all of their value.</li>
              <li><strong>Market manipulation</strong> — Crypto markets are less regulated than traditional markets and may be subject to manipulation.</li>
              <li><strong>Liquidity risk</strong> — Some cryptocurrencies may have low trading volume, making it difficult to buy or sell at expected prices.</li>
              <li><strong>Regulatory risk</strong> — Laws and regulations around cryptocurrency vary by jurisdiction and may change at any time, potentially affecting the value or legality of certain assets.</li>
              <li><strong>Technology risk</strong> — Blockchain networks, exchanges, and wallets may experience bugs, hacks, or outages.</li>
              <li><strong>Irreversibility</strong> — Cryptocurrency transactions cannot be reversed once confirmed on the blockchain.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">2. Automated Trading Risks</h2>
            <p>Using automated trading software (bots) introduces additional risks:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>No guaranteed performance</strong> — Past performance of any bot strategy does not guarantee future results. Strategies that performed well historically may perform poorly in different market conditions.</li>
              <li><strong>Software errors</strong> — Bots may execute trades incorrectly due to software bugs, API failures, or connectivity issues.</li>
              <li><strong>Execution delays</strong> — Market conditions may change between when a bot decides to trade and when the trade is actually executed.</li>
              <li><strong>Slippage</strong> — The actual execution price may differ from the expected price, especially during high volatility.</li>
              <li><strong>Over-trading</strong> — Automated systems may execute more trades than intended, increasing fees and exposure.</li>
              <li><strong>Strategy limitations</strong> — No trading strategy works in all market conditions. Strategies may fail during black swan events, flash crashes, or prolonged bear markets.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">3. Paper Trading vs. Live Trading</h2>
            <p><strong>Paper trading results DO NOT represent or guarantee live trading results.</strong> Differences include:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Paper trading does not account for real slippage, liquidity constraints, or order book depth</li>
              <li>Paper trades are always filled at the displayed price — real trades may not be</li>
              <li>Paper trading does not involve real exchange fees (our simulated fees are approximations)</li>
              <li>Emotional factors in live trading (fear, greed) do not affect paper trading</li>
              <li>Market impact of real orders is not simulated</li>
            </ul>
            <p className="mt-2">You should not assume that paper trading profits will translate to live trading profits.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">4. Leaderboard and Copy Trading</h2>
            <p>Leaderboard rankings and trader performance statistics:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Reflect <strong>past performance only</strong> and do not predict future results</li>
              <li>May include paper trading results that do not reflect real market conditions</li>
              <li>Are not recommendations to follow or copy any particular trader or strategy</li>
              <li>May change significantly from day to day</li>
            </ul>
            <p className="mt-2">Copying another trader's strategy does not guarantee you will achieve similar results. You are solely responsible for choosing which strategies to use.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">5. X Bot Trader Is Software, Not Advice</h2>
            <p><strong>We provide software tools. We do not provide:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Investment advice or recommendations</li>
              <li>Financial planning or advisory services</li>
              <li>Tax advice</li>
              <li>Legal advice</li>
              <li>Guaranteed returns or income</li>
              <li>Portfolio management</li>
            </ul>
            <p className="mt-2">The AI assistant feature provides informational responses based on market data. <strong>AI-generated analysis is not financial advice</strong> and should not be the sole basis for any trading decision.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">6. Your Responsibilities</h2>
            <p>Before using X Bot Trader for live trading, you should:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Understand how cryptocurrency markets work</li>
              <li>Only trade with money you can afford to lose completely</li>
              <li>Consult a qualified financial advisor if unsure</li>
              <li>Understand the specific risks of each trading strategy you use</li>
              <li>Monitor your bots regularly — do not rely solely on automation</li>
              <li>Comply with all tax reporting requirements in your jurisdiction</li>
              <li>Start with paper trading before using real funds</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">7. No Guarantees</h2>
            <p><strong>WE MAKE NO GUARANTEES OF ANY KIND REGARDING TRADING OUTCOMES.</strong> This includes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>No guarantee of profits</li>
              <li>No guarantee against losses</li>
              <li>No guarantee of software uptime or availability</li>
              <li>No guarantee that strategies will perform as backtested</li>
              <li>No guarantee that the AI assistant will provide accurate analysis</li>
            </ul>
            <p className="mt-2">Our money-back guarantee applies only to the software subscription fee if you are unsatisfied with the product — it does not cover or relate to any trading losses.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">8. Regulatory Notice</h2>
            <p>X Bot Trader is not registered as an investment advisor, broker-dealer, or securities exchange with any regulatory authority. The Service is a software tool and does not constitute a regulated financial service.</p>
            <p className="mt-2">Cryptocurrency regulations vary by jurisdiction. It is your responsibility to ensure that your use of this Service and cryptocurrency trading is legal in your jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">9. Acknowledgement</h2>
            <p>By using X Bot Trader, you acknowledge that you have read, understood, and agree to this Risk Disclaimer. You acknowledge that cryptocurrency trading is risky, that you may lose money, and that X Bot Trader is not responsible for any trading losses you may incur.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white">10. Contact</h2>
            <p>Questions about this disclaimer: <a href="mailto:xbottrader@gmail.com" className="text-blue-400 hover:underline">xbottrader@gmail.com</a></p>
          </section>
        </div>

        <div className="mt-12 flex gap-4 text-sm">
          <Link to="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
          <Link to="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
