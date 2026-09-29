import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card';
import { CREDIT_PACKS } from '@/lib/credits';
import {
  PRICING_BILLING_EMAIL,
  PRICING_BILLING_LEAD,
  PRICING_BILLING_QUESTION,
  PRICING_BILLING_TRAIL,
  PRICING_CHECKOUT_NOTE,
  PRICING_CLOSING_BODY,
  PRICING_CLOSING_HEADING,
  PRICING_CREDIT_BODY,
  PRICING_CREDIT_HEADING,
  PRICING_FAQ,
  PRICING_FREE_BODY,
  PRICING_FREE_HEADING,
  PRICING_PACKS_HEADING,
  PRICING_PACK_CTA_HREF,
  PRICING_PACK_CTA_LABEL,
  PRICING_PACK_TERMS,
  PRICING_PAGE_HEADING,
  PRICING_PAGE_INTRO,
  PRICING_PRIMARY_CTA_HREF,
  PRICING_PRIMARY_CTA_LABEL,
  PRICING_SECONDARY_CTA_HREF,
  PRICING_SECONDARY_CTA_LABEL,
  PRICING_TERMS_HREF,
  PRICING_TERMS_LABEL,
  pricingPackPdfLine,
} from '@/lib/pricing-page-copy';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <main className="mx-auto flex w-full max-w-container-3xl flex-col gap-12 px-4 pb-12 pt-24 text-primary lg:px-6">
      <header className="flex max-w-3xl flex-col gap-4">
        <h1 className="text-2xl font-semibold">{PRICING_PAGE_HEADING}</h1>
        <p className="text-lg text-muted-foreground">{PRICING_PAGE_INTRO}</p>
      </header>

      <section className="flex max-w-3xl flex-col gap-4">
        <h2 className="text-xl font-semibold">{PRICING_FREE_HEADING}</h2>
        <p className="text-muted-foreground">{PRICING_FREE_BODY}</p>
        <Link href={PRICING_PRIMARY_CTA_HREF} className="w-fit">
          <Button>{PRICING_PRIMARY_CTA_LABEL}</Button>
        </Link>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{PRICING_PACKS_HEADING}</h2>
        <p className="max-w-3xl text-muted-foreground">{PRICING_CHECKOUT_NOTE}</p>
        <ul className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {CREDIT_PACKS.map((pack) => (
            <li key={pack.credits} className="w-full">
              <Card className="h-full">
                <CardHeader className="gap-0 text-center">
                  <CardTitle className="text-lg font-semibold text-primary lg:text-xl">
                    {pack.credits.toLocaleString('en-US')} credits
                  </CardTitle>
                  <CardDescription className="text-lg text-muted-foreground">{pack.priceLabel}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2 text-muted-foreground">
                    <li>{pricingPackPdfLine(pack.credits)}</li>
                    {PRICING_PACK_TERMS.map((term) => (
                      <li key={term}>{term}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href={PRICING_PACK_CTA_HREF} className="w-full">
                    <Button className="w-full">{PRICING_PACK_CTA_LABEL}</Button>
                  </Link>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex max-w-3xl flex-col gap-4">
        <h2 className="text-xl font-semibold">{PRICING_CREDIT_HEADING}</h2>
        <p className="text-muted-foreground">{PRICING_CREDIT_BODY}</p>
      </section>

      <section className="flex max-w-3xl flex-col gap-6">
        <h2 className="text-xl font-semibold">Questions</h2>
        {PRICING_FAQ.map((item) => (
          <article key={item.question} className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold">{item.question}</h3>
            {item.question === PRICING_BILLING_QUESTION ? (
              <p className="text-muted-foreground">
                {PRICING_BILLING_LEAD}{' '}
                <Link href={PRICING_TERMS_HREF} className="underline">{PRICING_TERMS_LABEL}</Link>
                {' '}{PRICING_BILLING_TRAIL}{' '}
                <a href={`mailto:${PRICING_BILLING_EMAIL}`} className="underline">{PRICING_BILLING_EMAIL}</a>.
              </p>
            ) : (
              <p className="text-muted-foreground">{item.answer}</p>
            )}
          </article>
        ))}
      </section>

      <section className="flex max-w-3xl flex-col gap-4">
        <h2 className="text-xl font-semibold">{PRICING_CLOSING_HEADING}</h2>
        <p className="text-muted-foreground">{PRICING_CLOSING_BODY}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={PRICING_PRIMARY_CTA_HREF} className="w-fit">
            <Button>{PRICING_PRIMARY_CTA_LABEL}</Button>
          </Link>
          <Link href={PRICING_SECONDARY_CTA_HREF} className="w-fit">
            <Button variant="outline">{PRICING_SECONDARY_CTA_LABEL}</Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
