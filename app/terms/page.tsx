export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Terms of Service
      </h1>
      <p className="mb-10 text-sm text-white/30">Last updated: June 2, 2026</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-white/60">
        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using CityDiscuss ("the Service"), you agree to be
            bound by these Terms of Service. If you do not agree to these terms,
            please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            2. Use of the Service
          </h2>
          <p>
            CityDiscuss is a platform for local community discussion. You agree
            to use the Service only for lawful purposes and in a manner that
            does not infringe the rights of others. You must be at least 13
            years old to use the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            3. User Accounts
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account. You agree to notify us immediately of any unauthorized use
            of your account.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            4. User Content
          </h2>
          <p>
            You retain ownership of content you post on CityDiscuss. By posting
            content, you grant CityDiscuss a non-exclusive, royalty-free license
            to display and distribute that content on the platform. You are
            solely responsible for the content you post and agree not to post
            content that is:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Illegal, harmful, threatening, or harassing</li>
            <li>Defamatory, obscene, or invasive of another's privacy</li>
            <li>
              Spam, advertising, or commercial solicitation without permission
            </li>
            <li>Impersonating another person or entity</li>
            <li>
              In violation of any third party's intellectual property rights
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            5. Content Moderation
          </h2>
          <p>
            CityDiscuss reserves the right to remove any content that violates
            these terms or that we determine, in our sole discretion, to be
            harmful to the community. We may suspend or terminate accounts that
            repeatedly violate these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            6. Intellectual Property
          </h2>
          <p>
            The CityDiscuss name, logo, and platform design are the property of
            CityDiscuss. You may not use them without our prior written
            permission.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            7. Disclaimers
          </h2>
          <p>
            The Service is provided "as is" without warranties of any kind.
            CityDiscuss does not guarantee the accuracy, completeness, or
            usefulness of any content posted by users. We are not responsible
            for any harm resulting from your use of the Service or reliance on
            user-posted content.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            8. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, CityDiscuss shall not be
            liable for any indirect, incidental, special, or consequential
            damages arising from your use of the Service, even if advised of the
            possibility of such damages.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            9. Changes to Terms
          </h2>
          <p>
            We may update these Terms of Service from time to time. Continued
            use of the Service after changes are posted constitutes your
            acceptance of the revised terms. We will notify users of material
            changes by posting a notice on the site.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            10. Governing Law
          </h2>
          <p>
            These terms are governed by the laws of the Commonwealth of
            Pennsylvania, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-white">
            11. Contact
          </h2>
          <p>
            For questions about these Terms of Service, contact us at{" "}
            <a
              href="mailto:markcforte@gmail.com"
              className="text-blue-400 hover:underline"
            >
              markcforte@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
