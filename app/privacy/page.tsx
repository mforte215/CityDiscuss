export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Privacy Policy
      </h1>
      <p className="mb-10 text-sm text-gray-400 dark:text-white/30">
        Last updated: June 2, 2026
      </p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-gray-600 dark:text-white/60">
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            1. Information We Collect
          </h2>
          <p>
            When you create an account, we collect your email address and a
            username. If you sign in with Google, we also receive your name and
            profile picture from Google. We collect the content you post,
            including discussions and comments.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            2. How We Use Your Information
          </h2>
          <p>
            We use your information solely to operate CityDiscuss — to display
            your posts and comments, identify you to other users by your
            username, and send account-related emails such as password resets.
            We do not sell your data to third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            3. Data Storage
          </h2>
          <p>
            Your data is stored securely using Supabase, a managed database
            platform. We take reasonable technical measures to protect your
            information from unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            4. Third-Party Services
          </h2>
          <p>CityDiscuss uses the following third-party services:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              Google OAuth — for sign-in (governed by Google&apos;s Privacy Policy)
            </li>
            <li>Supabase — for database and authentication</li>
            <li>Vercel — for hosting</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            5. Cookies
          </h2>
          <p>
            We use cookies solely to maintain your login session. We do not use
            tracking or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            6. Your Rights
          </h2>
          <p>
            You may request deletion of your account and associated data at any
            time by contacting us at the email below. Upon request, we will
            delete your account and remove your personal information from our
            systems within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            7. Children&apos;s Privacy
          </h2>
          <p>
            CityDiscuss is not directed at children under the age of 13. We do
            not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            8. Changes to This Policy
          </h2>
          <p>
            We may update this privacy policy from time to time. We will notify
            users of significant changes by posting a notice on the site.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
            9. Contact
          </h2>
          <p>
            If you have questions about this privacy policy, contact us at{" "}
            <a
              href="mailto:markcforte@gmail.com"
              className="text-blue-500 hover:underline dark:text-blue-400"
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
