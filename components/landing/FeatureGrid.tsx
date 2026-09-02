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
      className="mx-auto grid w-full max-w-5xl gap-4 px-4 pb-24 sm:grid-cols-2 sm:px-6"
    >
      {features.map((feature) => (
        <Card key={feature.title} data-hero="feature" className="pointer-events-auto">
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
