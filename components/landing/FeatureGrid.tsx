"use client";

import { useRef } from "react";

import { Card, CardBody } from "@/components/ui";
import { useGsap } from "@/lib/anim";

export type LandingFeature = {
  title: string;
  body: string;
};

export function FeatureGrid({ features }: { features: LandingFeature[] }) {
  const rootRef = useRef<HTMLElement>(null);

  useGsap(
    rootRef,
    (gsap) => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-hero='feature']");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { y: 18, opacity: 0.78 },
          {
            y: 0,
            opacity: 1,
            duration: 0.48,
            ease: "power3.out",
            force3D: true,
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              once: true,
            },
            onStart() {
              card.style.willChange = "transform, opacity";
            },
            onComplete() {
              card.style.willChange = "auto";
            },
          },
        );
      });
    },
    [],
  );

  return (
    <section
      ref={rootRef}
      className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-app pb-[max(6rem,calc(4rem+var(--safe-bottom)))] sm:grid-cols-2"
    >
      {features.map((feature) => (
        <Card key={feature.title} data-hero="feature" className="min-w-0">
          <CardBody className="space-y-2">
            <h2 className="text-sm font-semibold tracking-tight text-ink">
              {feature.title}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              {feature.body}
            </p>
          </CardBody>
        </Card>
      ))}
    </section>
  );
}
