import { Link } from 'react-router-dom';
import SeoHead from '../components/seo/SeoHead';
import { TERMS_SEO } from '../seo/seoConfig.ts';
import '../components/styles/Legal.css';

const BRAND = 'CryptoSplitter';
const DATE = 'May 2025';

type Section = {
    title: string;
    content: (string | { bullets: string[] })[];
    warning?: boolean;
};

const sections: Section[] = [
    {
        title: '1. Acceptance of Terms',
        content: [
            `These Terms of Use ("Terms") constitute a legally binding agreement between you ("User", "you") and ${BRAND} ("we", "us", "our") governing your access to and use of the ${BRAND} platform, website, and associated smart contracts (collectively, the "Platform").`,
            'BY ACCESSING OR USING THE PLATFORM, YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, DO NOT USE THE PLATFORM.',
        ],
    },
    {
        title: '2. Eligibility',
        content: [
            {
                bullets: [
                    'You must be at least 18 years of age to use the Platform',
                    'You must not be located in a jurisdiction where use of the Platform is prohibited by law',
                    'You are solely responsible for ensuring your use complies with all applicable laws in your jurisdiction',
                ],
            },
        ],
    },
    {
        title: '3. Nature of the Platform',
        content: [
            `${BRAND} is a decentralized expense-splitting tool that facilitates the creation and execution of payment-splitting agreements on public blockchain networks. The Platform acts solely as an interface to interact with smart contracts deployed on these networks.`,
            'We are NOT a financial institution, payment processor, money transmitter, or custodian of any kind. We do not hold, control, or have access to your funds at any time.',
        ],
    },
    {
        title: '4. No Warranties — Platform Provided "AS IS"',
        warning: true,
        content: [
            'THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:',
            {
                bullets: [
                    'Warranties of merchantability or fitness for a particular purpose',
                    'Warranties that the Platform will be uninterrupted, error-free, or secure',
                    'Warranties regarding the accuracy, completeness, or reliability of any information on the Platform',
                    'Warranties that smart contracts will function as intended or be free from bugs or exploits',
                ],
            },
            'WE EXPRESSLY DISCLAIM ALL WARRANTIES TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW.',
        ],
    },
    {
        title: '5. Limitation of Liability',
        warning: true,
        content: [
            'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL CRYPTOSPLITER, ITS DEVELOPERS, CONTRIBUTORS, AFFILIATES, OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY:',
            {
                bullets: [
                    'Loss of cryptocurrency, tokens, or digital assets of any kind',
                    'Direct, indirect, incidental, special, consequential, or punitive damages',
                    'Loss of profits, revenue, data, business, or goodwill',
                    'Damages arising from smart contract bugs, exploits, or failures',
                    'Damages arising from blockchain network failures, congestion, or forks',
                    'Damages arising from unauthorized access to your wallet or private keys',
                    'Damages arising from actions or omissions of third parties',
                    'Damages arising from your failure to properly secure your wallet credentials',
                ],
            },
            'THIS LIMITATION APPLIES REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE) AND EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
            'IF YOU LOSE CRYPTOCURRENCY OR OTHER DIGITAL ASSETS WHILE USING THE PLATFORM FOR ANY REASON WHATSOEVER, WE BEAR NO RESPONSIBILITY AND NO LIABILITY. ALL TRANSACTIONS ON THE BLOCKCHAIN ARE FINAL AND IRREVERSIBLE.',
        ],
    },
    {
        title: '6. User Responsibilities',
        content: [
            'You are solely responsible for:',
            {
                bullets: [
                    'Safeguarding your wallet private keys and seed phrases — we cannot recover them',
                    'Verifying all transaction details before signing and submitting',
                    'Ensuring you are connected to the correct blockchain network',
                    'Any gas fees incurred in connection with transactions',
                    'The accuracy of participant wallet addresses you enter',
                    'Compliance with all applicable laws and regulations in your jurisdiction',
                    'Any tax obligations arising from cryptocurrency transactions you conduct',
                ],
            },
        ],
    },
    {
        title: '7. Assumption of Risk',
        warning: true,
        content: [
            'BY USING THE PLATFORM, YOU EXPRESSLY ACKNOWLEDGE AND ASSUME ALL RISKS ASSOCIATED WITH:',
            {
                bullets: [
                    'The highly volatile and speculative nature of cryptocurrency and digital assets',
                    'Smart contract technology, including potential bugs, exploits, and unexpected behavior',
                    'Blockchain network failures, downtime, forks, or protocol changes',
                    'Regulatory changes that may affect the legality or functionality of the Platform',
                    'The irreversible nature of blockchain transactions — once confirmed, they cannot be undone',
                    'Loss of access to your wallet resulting in permanent loss of funds',
                    'Third-party wallet providers and their potential failure, discontinuation, or compromise',
                ],
            },
        ],
    },
    {
        title: '8. Prohibited Activities',
        content: [
            'You agree not to use the Platform to:',
            {
                bullets: [
                    'Violate any applicable law or regulation',
                    'Engage in money laundering, fraud, or any other illegal financial activity',
                    'Attempt to exploit, hack, or attack the Platform or its smart contracts',
                    'Impersonate any person or entity',
                    'Introduce malware, viruses, or other harmful code',
                    'Circumvent any security measures of the Platform',
                ],
            },
        ],
    },
    {
        title: '9. Intellectual Property',
        content: [
            `All content, code, and materials on the Platform, excluding third-party content, are the property of ${BRAND} and its contributors. You may not copy, reproduce, distribute, or create derivative works without prior written consent.`,
        ],
    },
    {
        title: '10. Third-Party Services',
        content: [
            'The Platform integrates with third-party services including blockchain networks, wallet providers, and RPC providers. We have no control over these services and are not responsible for their availability, accuracy, security, or any losses arising from their use. Your interactions with third parties are solely between you and them.',
        ],
    },
    {
        title: '11. Indemnification',
        content: [
            `You agree to indemnify, defend, and hold harmless ${BRAND}, its developers, contributors, affiliates, officers, and agents from and against any claims, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or relating to: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any applicable law or the rights of any third party; or (d) any transaction you execute through the Platform.`,
        ],
    },
    {
        title: '12. Modifications to the Platform and Terms',
        content: [
            'We reserve the right to modify, suspend, or discontinue the Platform at any time without notice or liability. We may also update these Terms at any time. The updated Terms will be effective upon posting. Your continued use of the Platform after any changes constitutes your acceptance of the new Terms.',
        ],
    },
    {
        title: '13. Governing Law & Dispute Resolution',
        content: [
            'These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of the Platform shall be resolved through binding arbitration to the extent permitted by law. You waive any right to participate in class action lawsuits or class-wide arbitration.',
        ],
    },
    {
        title: '14. Severability',
        content: [
            'If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that the remaining Terms remain in full force and effect.',
        ],
    },
    {
        title: '15. Entire Agreement',
        content: [
            'These Terms, together with the Privacy Policy, constitute the entire agreement between you and the Platform regarding your use of the service and supersede all prior agreements and understandings.',
        ],
    },
    {
        title: '16. Contact',
        content: [
            `For questions regarding these Terms, please contact us through the official ${BRAND} communication channels.`,
        ],
    },
];

function TermsOfUse() {
    return (
        <>
            <SeoHead {...TERMS_SEO} />
            <div className="legal-wrap">
            <div className="legal-inner">

                <Link className="legal-back-btn" to="/">
                    ← Back
                </Link>

                <div className="legal-header">
                    <span className="legal-tag">Legal</span>
                    <h1 className="legal-title">Terms of Use</h1>
                    <p className="legal-subtitle">
                        {BRAND} &nbsp;·&nbsp; Last updated: {DATE}
                    </p>
                </div>

                <div className="legal-highlight legal-highlight--warn">
                    <span className="legal-highlight-icon">⚠️</span>
                    <p>
                        By using {BRAND} you accept full responsibility for your transactions.
                        Blockchain transactions are <strong>final and irreversible</strong>. We are not liable
                        for any loss of cryptocurrency or digital assets, regardless of cause.
                    </p>
                </div>

                <div className="legal-sections">
                    {sections.map((s, i) => (
                        <div key={i} className={`legal-section ${s.warning ? 'legal-section--warning' : ''}`}>
                            <h2 className="legal-section-title">{s.title}</h2>
                            {s.content.map((block, j) =>
                                typeof block === 'string' ? (
                                    <p key={j} className={`legal-p ${block === block.toUpperCase() && block.length > 40 ? 'legal-p--caps' : ''}`}>
                                        {block}
                                    </p>
                                ) : (
                                    <ul key={j} className="legal-list">
                                        {block.bullets.map((b, k) => (
                                            <li key={k}>{b}</li>
                                        ))}
                                    </ul>
                                )
                            )}
                        </div>
                    ))}
                </div>

                <div className="legal-footer">
                    <span>© {new Date().getFullYear()} {BRAND}. All rights reserved.</span>
                </div>
            </div>
        </div>
        </>
    );
}

export default TermsOfUse;