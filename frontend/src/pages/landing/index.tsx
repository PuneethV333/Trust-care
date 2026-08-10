import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
} from '../../components/ui/icons';

const HOW_IT_WORKS = [
  {
    icon: SearchIcon,
    title: 'Search verified helpers',
    body: 'Browse maids, babysitters, and nannies in your city with reviews, ratings, and live availability.',
  },
  {
    icon: CalendarIcon,
    title: 'Book a plan',
    body: 'Pick a helper and choose a service plan that fits — hourly, monthly, or yearly.',
  },
  {
    icon: CheckIcon,
    title: 'Review and trust',
    body: 'Track your bookings, leave reviews after each job, and report any issue directly.',
  },
];

const FEATURES = [
  {
    icon: ShieldIcon,
    title: 'Verified profiles',
    body: 'Every helper is vetted with ID and address document verification before going live.',
  },
  {
    icon: StarIcon,
    title: 'Real reviews',
    body: 'Ratings come only from households who actually booked the helper.',
  },
  {
    icon: BriefcaseIcon,
    title: 'Flexible plans',
    body: 'Compare transparent per-hour and monthly rates before you commit.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-neutral-800">
            <ShieldIcon className="h-6 w-6 text-primary-600" />
            Trust Care
          </Link>
          <Link to="/sign-in">
            <Button type="button">Sign in</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="bg-primary-600 text-white">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Trusted maids &amp; nannies for your home
              </h1>
              <p className="mt-4 text-lg text-primary-100">
                Trust Care connects you with verified household help — compare
                rates, read real reviews, and book in minutes.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/sign-in">
                  <Button className="bg-white text-primary-700 hover:bg-primary-50">
                    Get started
                  </Button>
                </Link>
                <Link to="/sign-in">
                  <Button className="border border-white/40 bg-transparent text-white hover:bg-white/10">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="bg-white/10 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">Find your next helper</p>
                  <p className="text-sm text-primary-100">
                    Search by service, city, and availability
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-semibold text-neutral-800">
            How it works
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
              <Card key={title} className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-primary-600">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-semibold text-neutral-800">{title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-14">
            <h2 className="text-center text-2xl font-semibold text-neutral-800">
              Built on trust
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="p-4 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold text-neutral-800">{title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 text-center">
          <h2 className="text-2xl font-semibold text-neutral-800">
            Ready to find help?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-neutral-600">
            Join households and helpers on Trust Care today.
          </p>
          <Link to="/sign-in" className="mt-5 inline-block">
            <Button size="lg">Get started</Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-neutral-500">
          Trust Care — trusted household help, verified.
        </div>
      </footer>
    </div>
  );
}