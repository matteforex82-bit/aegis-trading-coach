import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Aegis Trading Coach',
  description: 'Privacy Policy for Aegis Trading Coach platform',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p>
              Aegis Trading Coach ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading analytics and coaching platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Personal Information</h3>
            <p>We may collect the following personal information:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Name and email address</li>
              <li>Account credentials and authentication information</li>
              <li>Payment and billing information</li>
              <li>Communication preferences</li>
              <li>Support and correspondence records</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Trading Data</h3>
            <p>With your consent, we collect:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Trading account information and performance metrics</li>
              <li>Transaction history and trade details</li>
              <li>Risk management settings and preferences</li>
              <li>Platform usage and interaction data</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Technical Information</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage patterns and analytics data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Provide and maintain our services</li>
              <li>Process payments and manage subscriptions</li>
              <li>Analyze trading performance and provide insights</li>
              <li>Send important updates and notifications</li>
              <li>Improve our platform and develop new features</li>
              <li>Provide customer support</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
            <p>We do not sell, trade, or rent your personal information. We may share information in the following circumstances:</p>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Service Providers</h3>
            <p>We work with trusted third-party service providers who assist us in:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Payment processing (Stripe)</li>
              <li>Cloud hosting and data storage</li>
              <li>Analytics and performance monitoring</li>
              <li>Customer support services</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Legal Requirements</h3>
            <p>We may disclose information when required by law or to:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Comply with legal processes or government requests</li>
              <li>Protect our rights and property</li>
              <li>Ensure user safety and platform security</li>
              <li>Investigate potential violations of our terms</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p>We implement appropriate security measures to protect your information:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and monitoring</li>
              <li>Compliance with industry security standards</li>
              <li>Limited access to personal information on a need-to-know basis</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide our services and comply with legal obligations. Specifically:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Account information: Until account deletion plus 30 days</li>
              <li>Trading data: 7 years for regulatory compliance</li>
              <li>Payment records: As required by financial regulations</li>
              <li>Support communications: 3 years</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            <p>You have the following rights regarding your personal information:</p>
            
            <h3 className="text-xl font-medium mb-3 mt-6">Access and Portability</h3>
            <ul className="list-disc pl-6">
              <li>Request a copy of your personal information</li>
              <li>Export your trading data in a portable format</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Correction and Updates</h3>
            <ul className="list-disc pl-6">
              <li>Update your account information at any time</li>
              <li>Request correction of inaccurate data</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Deletion</h3>
            <ul className="list-disc pl-6">
              <li>Delete your account and associated data</li>
              <li>Request removal of specific information (subject to legal requirements)</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6">Communication Preferences</h3>
            <ul className="list-disc pl-6">
              <li>Opt out of marketing communications</li>
              <li>Manage notification settings</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 mt-4">
              <li>Remember your preferences and settings</li>
              <li>Analyze platform usage and performance</li>
              <li>Provide personalized content and features</li>
              <li>Ensure platform security</li>
            </ul>
            <p className="mt-4">
              You can control cookie settings through your browser preferences. However, disabling certain cookies may limit platform functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or through our platform. Your continued use of our services after such modifications constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p><strong>Email:</strong> privacy@aegistradingcoach.com</p>
              <p><strong>Support:</strong> support@aegistradingcoach.com</p>
              <p><strong>Website:</strong> https://aegistradingcoach.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}