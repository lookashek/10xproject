import type { UserProfile } from "@/types";

interface WelcomeSectionProps {
  user: UserProfile;
}

export function WelcomeSection({ user }: WelcomeSectionProps) {
  const displayName = user.username || user.email;

  return (
    <section className="mb-6 sm:mb-8" aria-labelledby="welcome-heading">
      <h1 id="welcome-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
        Witaj, {displayName}!
      </h1>
    </section>
  );
}
