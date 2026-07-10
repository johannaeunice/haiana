import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  AtSign,
  CalendarDays,
  Check,
  Clock3,
  Leaf,
  Mail,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import "./styles.css";

const launchDate = new Date("2026-09-01T00:00:00+01:00");
const marketingBaseline = 7;
const fallbackBrevoContacts = 1;
const totalPlaces = 100;
const recaptchaSiteKey = "6LdZjf4sAAAAAM5MHpLK16LhiWaezg9c3xkE9Ruh";
const localDevelopmentHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const countryCallingCodes = [
  "358", "353", "352", "351", "299", "298", "297", "291", "290", "269", "268", "267", "266", "265", "264", "263", "262", "261", "260", "258", "257", "256", "255", "254", "253", "252", "251", "250", "249", "248", "247", "246", "245", "244", "243", "242", "241", "240", "239", "238", "237", "236", "235", "234", "233", "232", "231", "230", "229", "228", "227", "226", "225", "224", "223", "222", "221", "220", "218", "216", "213", "212", "211", "98", "95", "94", "93", "92", "91", "90", "86", "84", "82", "81", "66", "65", "64", "63", "62", "61", "60", "58", "57", "56", "55", "54", "53", "52", "51", "49", "48", "47", "46", "45", "44", "43", "41", "40", "39", "36", "34", "33", "32", "31", "30", "27", "20", "7", "1",
];

function splitInternationalPhone(value) {
  const normalized = value.replace(/[^\d+]/g, "");

  let digits = normalized;

  // +237681385261
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
  }

  // 681385261 -> 237681385261
  if (/^6\d{8}$/.test(digits)) {
    digits = `237${digits}`;
  }

  // 237681385261 -> OK
  if (!/^\d+$/.test(digits)) {
    return null;
  }

  const countryCode = countryCallingCodes.find((code) =>
    digits.startsWith(code)
  );

  if (!countryCode || digits.length - countryCode.length < 6) {
    return null;
  }

  return {
    countryCode: `+${countryCode}`,
    localNumber: digits.slice(countryCode.length),
  };
}

const products = [
  {
    name: "Huile Routine Locks",
    label: "Nourrir",
    description: "Pour nourrir les longueurs et préserver la souplesse des locks.",
  },
  {
    name: "Huile Spéciale Pousse",
    label: "Stimuler",
    description: "Pour accompagner la croissance et maintenir un cuir chevelu sain.",
  },
  {
    name: "Beurre Whippé Locks",
    label: "Protéger",
    description: "Pour nourrir intensément et protéger les locks de la sécheresse.",
  },
];

const benefits = [
  "10 % de réduction sur toute la gamme",
  "Accès en avant-première avant le lancement public",
  "Actualités exclusives sur les formules et la disponibilité",
  "Communication directe via WhatsApp",
];

const testimonials = [
  { initials: "AT", name: "Prénom à venir" },
  { initials: "MK", name: "Prénom à venir" },
  { initials: "SD", name: "Prénom à venir" },
];

function getTimeLeft() {
  const distance = Math.max(launchDate.getTime() - Date.now(), 0);

  return {
    jours: Math.floor(distance / (1000 * 60 * 60 * 24)),
    heures: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    secondes: Math.floor((distance / 1000) % 60),
  };
}

function useAnimatedNumber(target, duration = 700) {
  const [value, setValue] = useState(target);
  const previousValueRef = useRef(target);

  useEffect(() => {
    const startValue = previousValueRef.current;
    previousValueRef.current = target;

    if (startValue === target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return undefined;
    }

    const startedAt = performance.now();
    let animationFrame;

    const animate = (now) => {
      const elapsed = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setValue(Math.round(startValue + (target - startValue) * eased));

      if (elapsed < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [duration, target]);

  return value;
}

function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Compte à rebours avant le lancement">
      {Object.entries(timeLeft).map(([label, value]) => (
        <div className="rounded-md border border-brand-brown/15 bg-white/70 p-4 text-center shadow-soft" key={label}>
          <span className="block font-serif text-3xl font-semibold text-brand-brown sm:text-4xl">
            {String(value).padStart(2, "0")}
          </span>
          <span className="mt-1 block text-xs font-bold uppercase tracking-[0.12em] text-brand-clay">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function App() {
  const isLocalDevelopment = localDevelopmentHosts.has(window.location.hostname);
  const [brevoContacts, setBrevoContacts] = useState(fallbackBrevoContacts);
  const [submissionStatus, setSubmissionStatus] = useState("idle");
  const [formError, setFormError] = useState("");
  const recaptchaContainerRef = useRef(null);
  const recaptchaWidgetRef = useRef(null);
  const targetReserved = Math.min(totalPlaces, marketingBaseline + brevoContacts);
  const displayedReserved = useAnimatedNumber(targetReserved);
  const displayedRemaining = Math.max(0, totalPlaces - displayedReserved);
  const progress = Math.min(100, Math.round((displayedReserved / totalPlaces) * 100));
  const isComplete = displayedReserved >= totalPlaces;
  const isUrgent = displayedReserved >= 90 && !isComplete;

  const refreshBrevoCount = useCallback(async (forceRefresh = false) => {
    try {
      const endpoint = forceRefresh ? "/api/brevo-count?refresh=1" : "/api/brevo-count";
      const response = await fetch(endpoint, { cache: "no-store" });
      const body = await response.json();

      if (!response.ok || !Number.isFinite(body?.brevoContacts)) {
        throw new Error(body?.error || `Brevo count failed with status ${response.status}.`);
      }

      if (body.fallback) {
        console.warn("[Brevo count] API fallback is active:", body);
      }

      setBrevoContacts(Math.max(0, body.brevoContacts));
    } catch (error) {
      console.error("[Brevo count] Unable to refresh waiting-list count:", error);
      setBrevoContacts((current) => Math.max(current, fallbackBrevoContacts));
    }
  }, []);

  useEffect(() => {
    refreshBrevoCount();
  }, [refreshBrevoCount]);

  useEffect(() => {
    if (isLocalDevelopment) {
      return undefined;
    }

    let recaptchaScript = document.querySelector('script[data-haiana-recaptcha="true"]');

    if (!recaptchaScript) {
      recaptchaScript = document.createElement("script");
      recaptchaScript.src = "https://www.google.com/recaptcha/api.js?hl=fr&render=explicit";
      recaptchaScript.async = true;
      recaptchaScript.defer = true;
      recaptchaScript.dataset.haianaRecaptcha = "true";
      document.head.appendChild(recaptchaScript);
    }

    let attempts = 0;
    const renderCaptcha = () => {
      if (
        window.grecaptcha?.render &&
        recaptchaContainerRef.current &&
        recaptchaWidgetRef.current === null
      ) {
        recaptchaWidgetRef.current = window.grecaptcha.render(recaptchaContainerRef.current, {
          sitekey: recaptchaSiteKey,
          theme: "light",
        });
        return;
      }

      attempts += 1;
      if (attempts < 50) {
        window.setTimeout(renderCaptcha, 200);
      }
    };

    renderCaptcha();
    return undefined;
  }, [isLocalDevelopment]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const phoneParts = splitInternationalPhone(form.elements.WHATSAPP.value);
    const captchaResponse = isLocalDevelopment
      ? "local-development-bypass"
      : recaptchaWidgetRef.current !== null && window.grecaptcha
        ? window.grecaptcha.getResponse(recaptchaWidgetRef.current)
        : "";

    setFormError("");

    if (!phoneParts) {
      setSubmissionStatus("error");
      setFormError("Une erreur est survenue. Vérifie les informations saisies puis réessaie.");
      return;
    }

    if (!isLocalDevelopment && !captchaResponse) {
      setSubmissionStatus("error");
      setFormError("Une erreur est survenue. Vérifie les informations saisies puis réessaie.");
      return;
    }

    setSubmissionStatus("submitting");

    try {
      const response = await fetch("/api/brevo-subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          PRENOM: form.elements.PRENOM.value,
          EMAIL: form.elements.EMAIL.value,
          SMS: phoneParts.localNumber,
          SMS__COUNTRY_CODE: phoneParts.countryCode,
          captchaResponse,
        }),
      });

      console.log("[Brevo] HTTP response status:", response.status);
      console.log("[Brevo] Full response object:", response);

      const responseBody = await response.json().catch(() => null);
      console.log("[Brevo] Response body:", responseBody);

      if (!response.ok || responseBody?.success !== true) {
        throw new Error(responseBody?.message || "Brevo rejected the subscription.");
      }

      form.reset();
      setSubmissionStatus("success");
      setFormError("");
      await refreshBrevoCount(true);
      if (!isLocalDevelopment) {
        window.grecaptcha?.reset(recaptchaWidgetRef.current);
      }
    } catch (error) {
      console.error("[Brevo] Subscription request failed:", error);
      setSubmissionStatus("error");
      setFormError("Une erreur est survenue. Vérifie les informations saisies puis réessaie.");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-brand-ivory text-brand-ink">
      <header className="sticky top-0 z-30 border-b border-brand-brown/10 bg-brand-ivory/88 backdrop-blur-xl">
        <nav className="mx-auto flex min-h-16 w-[min(1120px,92vw)] items-center justify-between" aria-label="Navigation principale">
          <a className="flex items-center gap-3" href="#accueil" aria-label="Accueil Haïana Hair Care">
            <BrandMark />
            <span className="font-serif text-xl font-semibold text-brand-brown">Haïana</span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-semibold text-brand-brown/80 md:flex">
            <a className="hover:text-brand-brown" href="#produits">Produits</a>
            <a className="hover:text-brand-brown" href="#histoire">Histoire</a>
            <a className="hover:text-brand-brown" href="#liste">Liste d'attente</a>
          </div>
          <a className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-brown px-5 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-brownDark focus:outline-none focus:ring-2 focus:ring-brand-clay focus:ring-offset-2 focus:ring-offset-brand-ivory" href="#liste">
            Je rejoins
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </nav>
      </header>

      <section id="accueil" className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(159,110,76,0.14),transparent_34%),linear-gradient(135deg,#fffaf1_0%,#f4ead9_55%,#efe0ca_100%)]" />
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-[min(1120px,92vw)] items-center gap-10 py-12 md:grid-cols-[1.02fr_0.98fr] md:py-16">
          <div className="animate-rise">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-brown/15 bg-white/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-clay">
              <Sparkles size={15} aria-hidden="true" />
              Pré-lancement exclusif
            </p>
            <h1 className="max-w-2xl font-serif text-[clamp(2.65rem,9.5vw,4.55rem)] font-semibold leading-[0.98] text-brand-brown">
              Rejoins les premiers clients Haïana et débloque -10 % sur toute la gamme.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-brand-ink/76">
              Des soins conçus pour les locks africaines. Lancement officiel le 1er septembre 2026.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand-brown px-7 font-bold text-white shadow-warm transition hover:-translate-y-0.5 hover:bg-brand-brownDark focus:outline-none focus:ring-2 focus:ring-brand-clay focus:ring-offset-2 focus:ring-offset-brand-ivory" href="#liste">
                Je rejoins Les Premiers
                <ArrowRight size={19} aria-hidden="true" />
              </a>
              <a className="inline-flex min-h-14 items-center justify-center rounded-full border border-brand-brown/15 bg-white/65 px-7 font-bold text-brand-brown transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-clay focus:ring-offset-2 focus:ring-offset-brand-ivory" href="#produits">
                Découvrir la gamme
              </a>
            </div>
          </div>

          <div className="animate-rise-delay">
            <div className="relative mx-auto max-w-[460px]">
              <div className="aspect-[4/5] overflow-hidden rounded-md border border-brand-brown/12 bg-brand-cream shadow-warm">
                <img
                  className="h-full w-full object-cover"
                  src="/haiana-locs-hero.jpg"
                  alt="Femme noire portant de longues locks naturelles et soignées"
                  width="1200"
                  height="1500"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              <div className="absolute -bottom-5 left-4 right-4 rounded-md border border-brand-brown/12 bg-white p-4 shadow-soft">
                <div className="grid grid-cols-2 gap-3">
                  <p className="m-0 text-sm font-bold text-brand-brown">
                    <span className="block font-serif text-2xl">{displayedReserved}</span>
                    places réservées
                  </p>
                  <p className="m-0 border-l border-brand-brown/12 pl-3 text-sm font-bold text-brand-clay">
                    <span className="block font-serif text-2xl">{displayedRemaining}</span>
                    {displayedRemaining === 1 ? "place restante" : "places restantes"}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-beige">
                  <div className="waiting-progress-fill h-full rounded-full bg-brand-brown" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-brand-brown/10 bg-white/52 py-8" aria-labelledby="waiting-title">
        <div className="mx-auto w-[min(1120px,92vw)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-clay">Liste d'attente</p>
              {isComplete ? (
                <h2 id="waiting-title" className="mt-2 font-serif text-2xl font-semibold text-brand-brown">
                  Les Premiers Haïana sont complets.
                </h2>
              ) : (
                <div id="waiting-title" className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
                  <p className="m-0 font-serif text-2xl font-semibold text-brand-brown">
                    {displayedReserved} places réservées
                  </p>
                  <p className="m-0 font-serif text-2xl font-semibold text-brand-clay">
                    {displayedRemaining} {displayedRemaining === 1 ? "place restante" : "places restantes"}
                  </p>
                </div>
              )}
            </div>
            <div className="w-full sm:max-w-md">
              <div className="h-3 overflow-hidden rounded-full bg-brand-beige" aria-hidden="true">
                <div className="waiting-progress-fill h-full rounded-full bg-brand-brown" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-sm text-brand-ink/68">
                {isComplete
                  ? "Vous pouvez toujours rejoindre la liste d'attente générale pour être informé(e) du lancement."
                  : "Les inscriptions sont ouvertes pour Les Premiers."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="produits" className="mx-auto w-[min(1120px,92vw)] py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-clay">Gamme de lancement</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-brown sm:text-5xl">
            Trois soins essentiels pour commencer ton rituel Haïana.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {products.map((product, index) => (
            <article className="group rounded-md border border-brand-brown/12 bg-white p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-warm" key={product.name}>
              <div className="grid aspect-[1.08] place-items-center rounded-sm bg-brand-cream">
                <div className={`product-bottle product-bottle-${index + 1} scale-110`}>
                  <span>{product.label}</span>
                </div>
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-brand-clay">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 font-serif text-2xl font-semibold text-brand-brown">{product.name}</h3>
              <p className="mt-3 leading-7 text-brand-ink/72">{product.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-brand-brown py-20 text-white" aria-labelledby="why-title">
        <div className="mx-auto grid w-[min(1120px,92vw)] gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-sand">Les Premiers</p>
            <h2 id="why-title" className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              Pourquoi rejoindre la première vague ?
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <div className="flex gap-3 rounded-md border border-white/12 bg-white/8 p-4" key={benefit}>
                <Check className="mt-1 shrink-0 text-brand-sand" size={19} aria-hidden="true" />
                <p className="m-0 leading-7 text-white/86">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="histoire" className="mx-auto grid w-[min(1120px,92vw)] gap-10 py-20 md:grid-cols-[0.92fr_1.08fr] md:items-center">
        <div className="rounded-md bg-brand-beige p-5">
          <div className="aspect-[4/4.5] rounded-sm bg-[linear-gradient(150deg,#efe0ca,#b98a60)] p-6 text-brand-brown">
            <Leaf size={34} aria-hidden="true" />
            <p className="mt-20 max-w-xs font-serif text-4xl font-semibold leading-tight">
              Des formules pensées avec respect, patience et précision.
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-clay">Notre histoire</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-brown sm:text-5xl">
            Des soins qui partent d'une vraie réalité.
          </h2>
          <p className="mt-6 text-xl leading-9 text-brand-ink/78">
            Haïana est née d'une conviction simple : les cheveux afro et les locks méritent des soins pensés pour eux.
          </p>
          <p className="mt-5 leading-8 text-brand-ink/72">
            Derrière Haïana, il y a des années de recherches, d'essais et de travail sur les formulations. Une volonté très personnelle : créer enfin des soins spécifiquement conçus pour les locks, qui comprennent leur besoin de nutrition, de légèreté et de régularité sans jamais les traiter comme un simple type de cheveux parmi d'autres.
          </p>
          <p className="mt-5 leading-8 text-brand-ink/72">
            La gamme se construit avec sa communauté. Les questions, les habitudes et les retours de personnes qui portent leurs locks au quotidien guident chaque choix. Haïana veut grandir à leurs côtés, avec des formules utiles, sensorielles et profondément ancrées dans leurs réalités.
          </p>
        </div>
      </section>

      <section className="bg-brand-cream py-20" aria-labelledby="countdown-title">
        <div className="mx-auto w-[min(900px,92vw)] text-center">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand-clay">
            <Clock3 size={16} aria-hidden="true" />
            Lancement officiel
          </p>
          <h2 id="countdown-title" className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-brown sm:text-5xl">
            Rendez-vous le 1er septembre 2026.
          </h2>
          <div className="mt-10">
            <Countdown />
          </div>
        </div>
      </section>

      <section id="liste" className="mx-auto grid w-[min(1120px,92vw)] gap-10 py-20 md:grid-cols-[0.85fr_1.15fr] md:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-clay">Réserve ta place</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-brown sm:text-5xl">
            Fais partie des 100 premiers clients Haïana.
          </h2>
          {/* <p className="mt-5 leading-8 text-brand-ink/72">
            Le formulaire est structuré pour une future intégration Brevo : champs nommés, consentement clair et redirection facile vers une liste d'attente.
          </p> */}
        </div>

        <div className="grid gap-4">
          {isUrgent && (
            <p className="m-0 rounded-md border border-brand-clay/25 bg-brand-cream p-4 text-sm font-bold leading-6 text-brand-brown" role="status">
              ⚠️ Plus que {displayedRemaining} places disponibles pour rejoindre Les Premiers Haïana.
            </p>
          )}
          {isComplete && (
            <div className="rounded-md border border-brand-brown/15 bg-brand-cream p-4 text-brand-brown" role="status">
              <p className="m-0 font-serif text-xl font-semibold">Les Premiers Haïana sont complets.</p>
              <p className="mt-2 mb-0 text-sm leading-6">
                Vous pouvez toujours rejoindre la liste d'attente générale pour être informé(e) du lancement.
              </p>
            </div>
          )}
          <form
            className="rounded-md border border-brand-brown/12 bg-white p-5 shadow-warm sm:p-7"
            action="/api/brevo-subscribe"
            method="POST"
            onSubmit={handleSubmit}
            data-brevo-ready="true"
          >
          <div className="grid gap-5">
            <label className="grid gap-2 font-bold text-brand-brown">
              Prénom
              <input className="min-h-13 rounded-md border border-brand-brown/15 bg-brand-ivory px-4 font-medium text-brand-ink outline-none transition focus:border-brand-clay focus:ring-4 focus:ring-brand-clay/15" name="PRENOM" type="text" autoComplete="given-name" required />
            </label>
            <label className="grid gap-2 font-bold text-brand-brown">
              Email
              <input className="min-h-13 rounded-md border border-brand-brown/15 bg-brand-ivory px-4 font-medium text-brand-ink outline-none transition focus:border-brand-clay focus:ring-4 focus:ring-brand-clay/15" name="EMAIL" type="email" autoComplete="email" required />
            </label>
            <label className="grid gap-2 font-bold text-brand-brown">
              WhatsApp
              <input className="min-h-13 rounded-md border border-brand-brown/15 bg-brand-ivory px-4 font-medium text-brand-ink outline-none transition focus:border-brand-clay focus:ring-4 focus:ring-brand-clay/15" name="WHATSAPP" type="tel" autoComplete="tel" inputMode="tel" required />
            </label>
            <label className="flex gap-3 text-sm leading-6 text-brand-ink/70">
              <input className="mt-1 size-4 rounded border-brand-brown/20 text-brand-brown focus:ring-brand-clay" name="CONSENT" type="checkbox" required />
              J'accepte de recevoir les informations de pré-lancement Haïana par email et WhatsApp.
            </label>
            <div className="flex gap-3 rounded-md border border-brand-brown/12 bg-brand-cream p-4 text-sm font-semibold leading-6 text-brand-brown">
              <ShieldCheck className="mt-0.5 shrink-0 text-brand-clay" size={20} aria-hidden="true" />
              <p className="m-0">Les 100 premiers inscrits recevront leur code de réduction avant le lancement.</p>
            </div>
            {!isLocalDevelopment && <div className="recaptcha-shell" ref={recaptchaContainerRef} />}
            <button className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand-brown px-7 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-brand-brownDark focus:outline-none focus:ring-2 focus:ring-brand-clay focus:ring-offset-2 focus:ring-offset-white disabled:cursor-wait disabled:opacity-70" type="submit" disabled={submissionStatus === "submitting"}>
              {submissionStatus === "submitting" ? "Inscription en cours..." : "Je réserve ma place"}
              <ArrowRight size={19} aria-hidden="true" />
            </button>
            {submissionStatus === "success" && (
              <p className="whitespace-pre-line rounded-md bg-brand-cream p-3 text-sm font-semibold leading-6 text-brand-brown" role="status">
                {"Bienvenue parmi Les Premiers ! 🌿\nTu seras notifié dès le lancement de la Ligne Locks.\nVérifie ta boîte mail."}
              </p>
            )}
            {submissionStatus === "error" && (
              <p className="rounded-md border border-red-900/15 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-900" role="alert">
                {formError}
              </p>
            )}
          </div>
          </form>
        </div>
      </section>

      {/* <section className="border-y border-brand-brown/10 bg-white/54 py-16" aria-labelledby="teaser-title">
        <div className="mx-auto grid w-[min(1120px,92vw)] gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand-brown text-white">
            <DropletMark />
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-brand-clay">
              <CalendarDays size={16} aria-hidden="true" />
              Après le lancement
            </p>
            <h2 id="teaser-title" className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-brown sm:text-5xl">
              Vous l'avez demandé. Nous l'avons créé.
            </h2>
            <p className="mt-5 max-w-3xl leading-8 text-brand-ink/72">
              Un soin centré sur l'hydratation des locks rejoindra la gamme après le lancement principal, pour répondre aux besoins de fraîcheur, de souplesse et de confort au quotidien.
            </p>
          </div>
        </div>
      </section> */}

      {/* <section className="mx-auto w-[min(1120px,92vw)] py-20" aria-labelledby="testimonials-title">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-clay">Bientôt leurs retours</p>
          <h2 id="testimonials-title" className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-brown sm:text-5xl">
            Les premières testeuses racontent
          </h2>
          <p className="mt-4 leading-8 text-brand-ink/68">
            Cet espace accueillera bientôt les expériences authentiques des premières personnes à tester les soins Haïana.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article className="rounded-md border border-brand-brown/12 bg-white p-5 shadow-soft" key={testimonial.initials}>
              <div className="flex items-center justify-between">
                <div className="grid size-14 place-items-center rounded-full bg-brand-cream font-serif text-lg font-semibold text-brand-brown" aria-label="Photo à venir">
                  {testimonial.initials}
                </div>
                <Quote className="text-brand-beige" size={30} aria-hidden="true" />
              </div>
              <div className="mt-8 space-y-3" aria-hidden="true">
                <span className="block h-2.5 w-full rounded-full bg-brand-cream" />
                <span className="block h-2.5 w-11/12 rounded-full bg-brand-cream" />
                <span className="block h-2.5 w-3/4 rounded-full bg-brand-cream" />
              </div>
              <p className="mt-7 mb-0 font-bold text-brand-brown">{testimonial.name}</p>
              <p className="mt-1 mb-0 text-sm text-brand-ink/55">Témoignage à venir</p>
            </article>
          ))}
        </div>
      </section> */}

      <footer className="bg-brand-brownDark py-10 text-white">
        <div className="mx-auto flex w-[min(1120px,92vw)] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-serif text-2xl font-semibold">Haïana Hair Care</p>
            <p className="mt-2 text-sm text-white/62">Copyright © 2026 Haïana Hair Care. Tous droits réservés.</p>
          </div>
          <div className="flex flex-col gap-3 text-sm sm:items-end">
            <a className="inline-flex items-center gap-2 text-white/82 transition hover:text-white" href="https://www.instagram.com/haiana.hair/" target="_blank" rel="noreferrer">
              <AtSign size={18} aria-hidden="true" />
              haiana.hair
            </a>
            <a className="inline-flex items-center gap-2 text-white/82 transition hover:text-white" href="https://facebook.com/share/1buPRE43ep/" target="_blank" rel="noreferrer">
              <UsersRound size={18} aria-hidden="true" />
              Haïana Hair Care Products
            </a>
            <div className="flex gap-3">
              <a className="grid size-11 place-items-center rounded-full border border-white/15 text-white/84 transition hover:bg-white hover:text-brand-brownDark" href="mailto:haiana.hair@gmail.com" aria-label="Email Haïana">
                <Mail size={19} aria-hidden="true" />
              </a>
              <a className="grid size-11 place-items-center rounded-full border border-white/15 text-white/84 transition hover:bg-white hover:text-brand-brownDark" href="https://wa.me/message/J5WDZDR2B4XAB1" aria-label="WhatsApp Haïana">
                <MessageCircle size={19} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function BrandMark() {
  const [logoMissing, setLogoMissing] = useState(false);

  if (logoMissing) {
    return (
      <span className="grid size-10 place-items-center rounded-full bg-brand-brown text-sm font-semibold text-brand-ivory">
        H
      </span>
    );
  }

  return (
    <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-brand-brown shadow-soft">
      <img
        className="h-full w-full object-cover"
        src="/haiana-logo-mark.jpg"
        alt=""
        onError={() => setLogoMissing(true)}
      />
    </span>
  );
}

function DropletMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.2C8.7 7.2 6 10.9 6 14.1a6 6 0 0 0 12 0c0-3.2-2.7-6.9-6-10.9Z" fill="currentColor" opacity="0.92" />
    </svg>
  );
}

createRoot(document.getElementById("root")).render(<App />);
