"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { practiceSlides } from "@/content/practice-slides";
import { Icon } from "./icon";

export function PracticeCarousel() {
  const track = useRef<HTMLUListElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const currentSlide = useRef(0);
  const trackWidth = useRef(0);

  useEffect(() => {
    const list = track.current;

    if (!list) {
      return;
    }

    trackWidth.current = list.clientWidth;

    const observer = new ResizeObserver(() => {
      if (list.clientWidth === trackWidth.current) {
        return;
      }

      trackWidth.current = list.clientWidth;
      list.scrollTo({
        left: currentSlide.current * list.children[0].getBoundingClientRect().width,
        behavior: "instant",
      });
    });

    observer.observe(list);

    return () => observer.disconnect();
  }, []);

  function goToSlide(index: number) {
    const list = track.current;

    if (!list) {
      return;
    }

    const nextSlide = (index + practiceSlides.length) % practiceSlides.length;

    list.scrollTo({
      left: nextSlide * list.children[0].getBoundingClientRect().width,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    const destinations: Record<string, number> = {
      ArrowLeft: activeSlide - 1,
      ArrowRight: activeSlide + 1,
      Home: 0,
      End: practiceSlides.length - 1,
    };

    if (Object.hasOwn(destinations, event.key)) {
      event.preventDefault();
      goToSlide(destinations[event.key]);
    }
  }

  return (
    <div
      className="practice-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Explore our practice areas"
    >
      <ul
        className="practice-carousel-track"
        id="practice-slides"
        ref={track}
        tabIndex={0}
        aria-label="Practice area slides"
        onKeyDown={handleKeyDown}
        onScroll={(event) => {
          const list = event.currentTarget;

          if (list.clientWidth !== trackWidth.current) {
            return;
          }

          const slideWidth = list.children[0].getBoundingClientRect().width;

          const index = Math.max(
            0,
            Math.min(practiceSlides.length - 1, Math.round(list.scrollLeft / slideWidth)),
          );

          currentSlide.current = index;
          setActiveSlide(index);
        }}
      >
        {practiceSlides.map((slide, index) => (
          <li
            className="practice-slide"
            key={slide.href}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${practiceSlides.length}`}
          >
            <div className="practice-slide-photo">
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                sizes="(max-width: 760px) 100vw, 55vw"
              />
            </div>
            <div className="practice-slide-copy">
              <h3>{slide.title}</h3>
              <p>{slide.summary}</p>
              <Link href={slide.href} className="text-link">
                Find out more <Icon name="arrow-up-right" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <div className="practice-carousel-controls">
        <p className="practice-carousel-status" role="status" aria-atomic="true">
          {activeSlide + 1} of {practiceSlides.length}
        </p>
        <div className="practice-carousel-dots" role="group" aria-label="Choose a practice area">
          {practiceSlides.map((slide, index) => (
            <button
              key={slide.href}
              type="button"
              aria-label={`Show ${slide.title}`}
              aria-controls="practice-slides"
              aria-current={index === activeSlide ? "true" : undefined}
              onClick={() => goToSlide(index)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="practice-carousel-arrows" role="group" aria-label="Slide navigation">
          <button
            type="button"
            aria-label="Previous practice area"
            aria-controls="practice-slides"
            onClick={() => goToSlide(activeSlide - 1)}
          >
            <Icon name="arrow-left" />
          </button>
          <button
            type="button"
            aria-label="Next practice area"
            aria-controls="practice-slides"
            onClick={() => goToSlide(activeSlide + 1)}
          >
            <Icon name="arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
