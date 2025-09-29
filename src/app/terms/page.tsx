import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Aegis Trading Coach',
  description: 'Terms of Service for Aegis Trading Coach platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Aegis Trading Coach ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p>
              Aegis Trading Coach is a trading analytics and coaching platform that provides:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Trading performance analysis and metrics</li>
              <li>Risk management tools and alerts</li>
              <li>Educational resources and coaching materials</li>
              <li>Account synchronization with trading platforms</li>
              <li>Subscription-based premium features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p>
              To access certain features of the Service, you must register for an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Billing</h2>
            <p>
              Premium features require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Pay all applicable fees as described in your subscription plan</li>
              <li>Automatic renewal unless cancelled before the renewal date</li>
              <li>Our right to change subscription fees with 30 days notice</li>
              <li>No refunds for partial months of service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p>
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Transmit harmful, offensive, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use the Service for any commercial purpose without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibent mb-4">6. Data and Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using the Service, you consent to our data practices as described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Disclaimers</h2>
            <p>
              <strong>Trading Risk Warning:</strong> Trading financial instruments involves substantial risk and may result in significant losses. Past performance is not indicative of future results. The Service provides educational and analytical tools only and does not constitute financial advice.
            </p>
            <p className="mt-4">
              The Service is provided "as is" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p>
              In no event shall Aegis Trading Coach be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to trading losses, loss of profits, or loss of data, arising out of or in connection with your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p>
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p><strong>Email:</strong> support@aegistradingcoach.com</p>
              <p><strong>Website:</strong> https://aegistradingcoach.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}