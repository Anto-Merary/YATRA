import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NoiseOverlay } from "@/components/NoiseOverlay";

export function TermsConditionsPage() {
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
              Terms & Conditions
            </h1>
            <p className="text-sm text-white/60">
              Last updated: January 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none space-y-6 sm:space-y-8">
            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                By accessing and using the YATRA'26 website and participating in our events, you accept and agree to be bound 
                by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our website 
                or participate in our events.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">2. Event Registration and Participation</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-white/95 mb-2">2.1 Eligibility</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    YATRA'26 is open to students from various educational institutions. Participants must:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm sm:text-base text-white/80 ml-4">
                    <li>Be currently enrolled in a recognized educational institution</li>
                    <li>Provide valid student identification when requested</li>
                    <li>Comply with all event rules and regulations</li>
                    <li>Maintain appropriate conduct throughout the event</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white/95 mb-2">2.2 Registration Process</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Event registration is subject to availability and may close when capacity is reached. 
                    Registration fees are non-refundable except as specified in our refund policy. 
                    All registrations must be completed through our official website or authorized channels.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white/95 mb-2">2.3 Pass Purchase</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Pass prices vary based on institution affiliation. Passes grant access to specified events 
                    and activities as outlined in the pass description. Passes are non-transferable and must be 
                    presented at the venue for entry.
                  </p>
                </div>
              </div>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">3. Payment Terms</h2>
              <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-white/80 ml-4">
                <li>All payments must be made through our authorized payment gateway</li>
                <li>Payment confirmation will be sent to your registered email address</li>
                <li>Transaction fees, if any, are non-refundable</li>
                <li>In case of payment failure, your registration may be cancelled</li>
                <li>Refunds, if applicable, will be processed according to our refund policy</li>
              </ul>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">4. Code of Conduct</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                All participants are expected to maintain high standards of behavior and respect for others. 
                The following conduct is strictly prohibited:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-sm sm:text-base text-white/80 ml-4">
                <li>Any form of harassment, discrimination, or inappropriate behavior</li>
                <li>Disruption of events or interference with other participants</li>
                <li>Possession or use of prohibited substances or items</li>
                <li>Damage to property or facilities</li>
                <li>Violation of any local, state, or national laws</li>
                <li>Unauthorized photography or recording where prohibited</li>
              </ul>
              <p className="text-sm sm:text-base leading-relaxed mt-4">
                Violation of the code of conduct may result in immediate removal from the event, 
                cancellation of registration without refund, and potential legal action.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">5. Event Rules and Regulations</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Each event within YATRA'26 may have specific rules and regulations. Participants are responsible 
                for reviewing and understanding the rules for each event they register for. Event organizers 
                reserve the right to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-sm sm:text-base text-white/80 ml-4">
                <li>Modify event rules or schedules as necessary</li>
                <li>Disqualify participants who violate event rules</li>
                <li>Cancel or reschedule events due to unforeseen circumstances</li>
                <li>Make final decisions regarding event outcomes and prizes</li>
              </ul>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                All content on the YATRA'26 website, including logos, designs, text, images, and multimedia, 
                is the property of Rajalakshmi Institutions and is protected by copyright and trademark laws. 
                Unauthorized use, reproduction, or distribution of any content is strictly prohibited.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">7. Photography and Media</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                By participating in YATRA'26, you consent to being photographed, filmed, or recorded. 
                Rajalakshmi Institutions and event organizers may use these materials for promotional, 
                educational, or archival purposes without additional compensation or permission.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">8. Liability and Waiver</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Participants acknowledge that participation in YATRA'26 events involves inherent risks. 
                By registering and participating, you agree to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-2 text-sm sm:text-base text-white/80 ml-4">
                <li>Assume all risks associated with event participation</li>
                <li>Release Rajalakshmi Institutions, event organizers, and sponsors from any liability for injuries, 
                    damages, or losses incurred during the event</li>
                <li>Indemnify and hold harmless the organizers from any claims arising from your participation</li>
                <li>Ensure you have adequate health insurance coverage</li>
              </ul>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">9. Cancellation and Refund Policy</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-white/95 mb-2">9.1 Event Cancellation</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    In the event of cancellation due to circumstances beyond our control (natural disasters, 
                    government restrictions, etc.), we will attempt to reschedule or provide appropriate refunds 
                    as determined by the organizing committee.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white/95 mb-2">9.2 Participant Cancellation</h3>
                  <p className="text-sm sm:text-base leading-relaxed">
                    Cancellation requests must be submitted in writing. Refund eligibility and amounts are 
                    determined by the cancellation date and event-specific policies. Processing fees may apply.
                  </p>
                </div>
              </div>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">10. Privacy and Data Protection</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Your use of our website and participation in events is also governed by our Privacy Policy. 
                Please review our Privacy Policy to understand how we collect, use, and protect your personal information.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">11. Modifications to Terms</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective 
                immediately upon posting on our website. Your continued use of our website or participation in 
                events after changes are posted constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">12. Dispute Resolution</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                Any disputes arising from these Terms and Conditions or your participation in YATRA'26 shall be 
                resolved through good faith negotiation. If resolution cannot be reached, disputes shall be subject 
                to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu, India.
              </p>
            </section>

            <section className="text-white/90 space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">13. Contact Information</h2>
              <p className="text-sm sm:text-base leading-relaxed">
                For questions, concerns, or clarifications regarding these Terms and Conditions, please contact us:
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
