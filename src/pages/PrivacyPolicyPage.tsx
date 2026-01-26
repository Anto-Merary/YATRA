  import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NoiseOverlay } from "@/components/NoiseOverlay";

export function PrivacyPolicyPage() {
  // Ensure scroll to top when navigating to this page
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <NoiseOverlay opacity={0.3} />
      
      <div className="container-max relative z-10 py-8 sm:py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-sm text-white/60">
              Last updated: January 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-6 sm:space-y-8">
            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Welcome to YATRA'26, the grand intercollegiate cultural fest of Rajalakshmi Institutions. 
                We are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                visit our website and participate in our events.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-white/95 mb-2">2.1 Personal Information</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    When you register for events, purchase passes, or interact with our website, we may collect:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm sm:text-base text-white/80 ml-4">
                    <li>Name and contact information (email, phone number)</li>
                    <li>Institution name and student identification details</li>
                    <li>Payment information (processed securely through third-party payment gateways)</li>
                    <li>Event registration preferences and participation details</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white/95 mb-2">2.2 Automatically Collected Information</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    We may automatically collect certain information about your device and usage patterns, including:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm sm:text-base text-white/80 ml-4">
                    <li>IP address and browser type</li>
                    <li>Device information and operating system</li>
                    <li>Pages visited and time spent on our website</li>
                    <li>Referring website addresses</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-sm sm:text-base text-white/80 ml-4">
                <li>To process event registrations and pass purchases</li>
                <li>To communicate with you about event updates, schedules, and important announcements</li>
                <li>To manage event participation and ensure smooth event operations</li>
                <li>To improve our website functionality and user experience</li>
                <li>To send promotional materials and updates about YATRA'26 (with your consent)</li>
                <li>To comply with legal obligations and protect our rights</li>
              </ul>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-sm sm:text-base text-white/80 ml-4">
                <li>With trusted service providers who assist in operating our website and conducting events (payment processors, email services)</li>
                <li>With Rajalakshmi Institutions and authorized event organizers for event management purposes</li>
                <li>When required by law or to protect our rights and safety</li>
                <li>With your explicit consent for specific purposes</li>
              </ul>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">5. Data Security</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
                the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-sm sm:text-base text-white/80 ml-4">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate or incomplete information</li>
                <li>Request deletion of your personal information (subject to legal and operational requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing where applicable</li>
              </ul>
              <p className="text-sm sm:text-base leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:yatra@ritchennai.edu.in" className="text-yatra-300 hover:text-yatra-200 underline">yatra@ritchennai.edu.in</a>.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Our website may use cookies and similar tracking technologies to enhance your browsing experience, 
                analyze website traffic, and personalize content. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">8. Third-Party Links</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Our website may contain links to third-party websites, including payment gateways and social media platforms. 
                We are not responsible for the privacy practices of these external sites. We encourage you to review their 
                privacy policies before providing any personal information.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">9. Children's Privacy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                YATRA'26 is an intercollegiate event primarily for students. We do not knowingly collect personal information 
                from children under 13 years of age. If you believe we have inadvertently collected such information, 
                please contact us immediately.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We reserve the right to update this Privacy Policy at any time. We will notify you of any material changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of 
                our website after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                please contact us:
              </p>
              <div className="mt-4 space-y-2 text-sm sm:text-base text-white/80">
                <p><strong className="text-white">Email:</strong> <a href="mailto:yatra@ritchennai.edu.in" className="text-yatra-300 hover:text-yatra-200 underline">yatra@ritchennai.edu.in</a></p>
                <p><strong className="text-white">Phone:</strong> <a href="tel:+919843656238" className="text-yatra-300 hover:text-yatra-200">+91 98436 56238</a> / <a href="tel:+919080850106" className="text-yatra-300 hover:text-yatra-200">+91 90808 50106</a></p>
                <p><strong className="text-white">Address:</strong> Rajalakshmi Institute of Technology, Bangalore Highway Road, Kuthambakkam, Chennai, Tamil Nadu - 600124</p>
              </div>
            </section>
          </div>

          {/* Back Button */}
          <div className="mt-12 sm:mt-16 flex justify-center">
            <Button asChild variant="secondary" className="border border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
