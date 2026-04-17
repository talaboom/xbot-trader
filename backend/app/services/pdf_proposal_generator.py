from weasyprint import HTML
import os

# Define the content for the PDF document
html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 20mm;
            background-color: #ffffff;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .header-bar {
            background-color: #003087; /* RBC Blue */
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 30px;
        }
        h1 { font-size: 22pt; margin: 0; }
        h2 { font-size: 16pt; color: #003087; border-bottom: 2px solid #003087; padding-bottom: 5px; margin-top: 25px; }
        h3 { font-size: 13pt; color: #444; margin-top: 15px; }
        .contact-info {
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 10pt;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background-color: #f2f2f2;
            text-align: left;
            padding: 10px;
            border: 1px solid #ddd;
        }
        td {
            padding: 10px;
            border: 1px solid #ddd;
            font-size: 10pt;
        }
        .highlight-box {
            background-color: #eef4ff;
            border-left: 5px solid #003087;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 50px;
            font-size: 9pt;
            text-align: center;
            color: #777;
        }
    </style>
</head>
<body>

    <div class="header-bar">
        <h1>SYNC SECURITY AI INTEGRATION</h1>
        <p>Business Funding & Infrastructure Proposal - April 2026</p>
    </div>

    <div class="contact-info">
        <strong>Principal Founder:</strong> Ivan Stavrikov<br>
        <strong>Role:</strong> Principal Systems Architect<br>
        <strong>Location:</strong> Mississauga, Ontario<br>
        <strong>Projected Loan:</strong> $160,000 CAD (CSBFP)<br>
        <strong>Platform:</strong> xbottrader.ca | lvstavrikov@gmail.com
    </div>

    <h2>1. Executive Summary: The AI Utility Model</h2>
    <p>
        Sync Security AI Integration is establishing a high-density "Sovereign AI" compute node in Mississauga.
        Unlike traditional tech firms, our <strong>"Anti-Gravity"</strong> model utilizes autonomous AI ensembles
        to manage infrastructure, security, and deployments. This eliminates human payroll overhead—the largest
        risk factor in tech startups—ensuring a 90%+ gross profit margin.
    </p>

    <div class="highlight-box">
        <strong>The "Digital Gold" Asset:</strong> We are acquiring the <strong>NVIDIA H200 NVL (141GB)</strong>
        architecture. With a dual-card configuration, we offer <strong>282GB of HBM3e VRAM</strong>, placing
        Sync Security in the top 1% of private AI infrastructure providers in the Toronto-Waterloo tech corridor.
    </div>

    <h2>2. Competitive Advantage vs. Global Cloud</h2>
    <table>
        <tr>
            <th>Feature</th>
            <th>Amazon AWS (P5e/H200)</th>
            <th>Sync Security (Local Node)</th>
        </tr>
        <tr>
            <td><strong>Hourly Rate</strong></td>
            <td>~$10.50 - $13.00 CAD</td>
            <td><strong>$5.00 - $6.50 CAD</strong></td>
        </tr>
        <tr>
            <td><strong>Data Residency</strong></td>
            <td>US-Owned / Subject to CLOUD Act</td>
            <td><strong>100% Ontario Owned & Managed</strong></td>
        </tr>
        <tr>
            <td><strong>Payroll Overhead</strong></td>
            <td>Billions in Salary Costs</td>
            <td><strong>$0.00 (Autonomous Management)</strong></td>
        </tr>
    </table>

    <h2>3. Equipment Specification (Quote Manifest)</h2>
    <p>To be sourced primarily via CDW Canada for enterprise-grade reliability and local warranty support.</p>
    <ul>
        <li><strong>GPUs:</strong> 2x NVIDIA H200 NVL (141GB HBM3e each) - 282GB Total Pool.</li>
        <li><strong>Chassis:</strong> Supermicro GPU SuperWorkstation Tower (SYS-741GE-TNRT).</li>
        <li><strong>Power:</strong> Dual 2000W+ Redundant Power Supplies (Optimized for 240V).</li>
        <li><strong>Compute:</strong> 2x Intel Xeon Gold 6430 (32-Core) Scalable Processors.</li>
        <li><strong>Memory:</strong> 512GB DDR5-4800 ECC Registered RAM.</li>
        <li><strong>Storage:</strong> 1.92TB Boot NVMe + 7.68TB Enterprise Data NVMe.</li>
        <li><strong>Bridge:</strong> NVIDIA NVLink Bridge (High-speed P2P interconnect).</li>
    </ul>

    <h2>4. Capital Allocation & Budget ($160,000 CAD)</h2>
    <table>
        <tr>
            <th>Category</th>
            <th>Allocation (Estimated)</th>
            <th>Notes</th>
        </tr>
        <tr>
            <td>Equipment (Integrated Node)</td>
            <td>$108,000</td>
            <td>Total hardware cost including CDW integration.</td>
        </tr>
        <tr>
            <td>Sales Tax (HST 13%)</td>
            <td>$14,040</td>
            <td>Full Ontario tax coverage.</td>
        </tr>
        <tr>
            <td>Site Activation</td>
            <td>$4,500</td>
            <td>240V Electrical upgrade & dedicated Fiber install.</td>
        </tr>
        <tr>
            <td><strong>Working Capital</strong></td>
            <td><strong>$33,460</strong></td>
            <td>6-month debt service & operating reserve.</td>
        </tr>
    </table>

    <h2>5. Security & Collateral</h2>
    <p>
        The loan request is highly secured via:
        <ol>
            <li><strong>Hardware Equity:</strong> The H200 is a "high-liquidity" asset with 90%+ value retention in the 2026 market.</li>
            <li><strong>Personal Guarantee:</strong> Co-signed with $400,000 in residential equity in Mississauga.</li>
            <li><strong>Cash Reserves:</strong> Supported by existing TFSA/GIC portfolios.</li>
        </ol>
    </p>

    <div class="footer">
        Confidential Document - Sync Security AI Integration © 2026<br>
        Prepared for RBC Business Financial Services
    </div>

</body>
</html>
"""

# Output paths
html_file = "Sync_Security_Proposal_2026.html"
pdf_file = "Sync_Security_AI_Proposal.pdf"

# Save HTML
with open(html_file, "w") as f:
    f.write(html_content)

# Convert to PDF
HTML(string=html_content).write_pdf(pdf_file)

print(f"File generated: {pdf_file}")
