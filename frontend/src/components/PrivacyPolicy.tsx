import './styles/Legal.css';

const BRAND = 'CryptoSplitter';
const DATE = 'May 2025';

type Section = {
    title: string;
    content: (string | { bullets: string[] })[];
};

const sections: Section[] = [
    {
        title: '1. Introduction',
        content: [
            `${BRAND} ("we", "us", "our") is a decentralized expense-splitting platform that operates on public blockchain networks. This Privacy Policy explains what information we collect, how we use it, and your rights regarding that information.`,
            'By accessing or using the Platform, you acknowledge that you have read, understood, and agree to this Privacy Policy.',
        ],
    },
    {
        title: '2. Information We Collect',
        content: [
            '2.1 Information You Provide',
            {
                bullets: [
                    'Wallet addresses you connect to the Platform',
                    'Participant names you enter when creating split events',
                    'Event titles, categories, and amounts you submit',
                ],
            },
            '2.2 Information Collected Automatically',
            {
                bullets: [
                    'On-chain transaction data (inherently public on the blockchain)',
                    'Browser type, IP address, and device information for security and analytics',
                    'Usage data such as pages visited and actions taken on the Platform',
                ],
            },
            '2.3 Information We Do NOT Collect',
            {
                bullets: [
                    'We do not collect your full name, email address, or government-issued identification unless you voluntarily provide it',
                    'We do not store private keys or seed phrases — ever',
                ],
            },
        ],
    },
    {
        title: '3. How We Use Your Information',
        content: [
            {
                bullets: [
                    'To operate and maintain the Platform',
                    'To display event and payment history associated with your wallet',
                    'To improve the Platform and user experience',
                    'To detect and prevent fraudulent or unauthorized activity',
                    'To comply with applicable legal obligations',
                ],
            },
        ],
    },
    {
        title: '4. Blockchain Data & Public Transparency',
        content: [
            'All transactions executed through the Platform are recorded on public blockchain networks. This data is permanently public, immutable, and visible to anyone. We have no ability to alter, delete, or hide on-chain data. By using the Platform, you understand and accept that your wallet address and transaction history are publicly visible.',
        ],
    },
    {
        title: '5. Data Sharing',
        content: [
            'We do not sell, rent, or trade your personal information. We may share information only in the following circumstances:',
            {
                bullets: [
                    'With service providers who assist in operating the Platform, under strict confidentiality obligations',
                    'If required by law, court order, or governmental authority',
                    'To protect the rights, property, or safety of the Platform, our users, or the public',
                ],
            },
        ],
    },
    {
        title: '6. Data Retention',
        content: [
            'We retain off-chain data (event records, participant names) for as long as necessary to provide the service. On-chain data is retained permanently by the nature of blockchain technology and is outside our control.',
        ],
    },
    {
        title: '7. Security',
        content: [
            'We implement reasonable technical and organizational measures to protect your information. However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security, and we are not responsible for unauthorized access that is beyond our reasonable control.',
        ],
    },
    {
        title: '8. Third-Party Links & Services',
        content: [
            'The Platform may integrate with third-party wallets, blockchain networks, and services. These third parties have their own privacy policies, and we have no responsibility for their practices. We encourage you to review their policies before use.',
        ],
    },
    {
        title: "9. Children's Privacy",
        content: [
            'The Platform is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us so we can take appropriate action.',
        ],
    },
    {
        title: '10. Changes to This Policy',
        content: [
            'We may update this Privacy Policy from time to time. We will notify users of material changes by updating the date at the top of this document. Continued use of the Platform after changes constitutes acceptance of the updated Policy.',
        ],
    },
    {
        title: '11. Contact',
        content: [
            `If you have questions about this Privacy Policy, please contact us through the official ${BRAND} communication channels.`,
        ],
    },
];

function PrivacyPolicy() {
    const handleBack = () => {
        window.location.href = '/';
    };

    return (
        <div className="legal-wrap">
            <div className="legal-inner">
                <button className="legal-back-btn" onClick={handleBack}>
                    ← Back
                </button>

                <div className="legal-header">
                    <span className="legal-tag">Legal</span>
                    <h1 className="legal-title">Privacy Policy</h1>
                    <p className="legal-subtitle">
                        {BRAND} &nbsp;·&nbsp; Last updated: {DATE}
                    </p>
                </div>

                <div className="legal-highlight">
                    <span className="legal-highlight-icon">🔒</span>
                    <p>
                        We respect your privacy. We do not sell your data, we never touch your private keys,
                        and all on-chain transactions are public by the nature of the blockchain — not because of us.
                    </p>
                </div>

                <div className="legal-sections">
                    {sections.map((s, i) => (
                        <div key={i} className="legal-section">
                            <h2 className="legal-section-title">{s.title}</h2>
                            {s.content.map((block, j) =>
                                typeof block === 'string' ? (
                                    block.match(/^\d+\.\d+/) ? (
                                        <h3 key={j} className="legal-subsection-title">{block}</h3>
                                    ) : (
                                        <p key={j} className="legal-p">{block}</p>
                                    )
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
    );
}

export default PrivacyPolicy;