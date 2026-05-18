export const metaTitle = "Lumen Pronunciation";
export const metaDesc =
  "A tiny browser extension that puts the phonetic alphabet above any English word you hover. Audio in US, UK, and AU. Score your speaking. Free on Chrome, Edge, Firefox and Safari.";

export const ogSize = {
  width: 1600,
  height: 800,
};

export const ogImageProps = {
  ...ogSize,
  alt: "Lumen Pronunciation — IPA over every English word, in your browser",
  contentType: "image/png",
};

export const defaultOpenGraph = {
  siteName: "Lumen Pronunciation",
  images: [
    {
      url: "/images/og.png",
      ...ogImageProps,
    },
  ],
  locale: "en_US",
  type: "website",
};

export const defaultTwitter = {
  card: "summary_large_image",
  images: [
    {
      url: "/images/og.png",
      ...ogImageProps,
    },
  ],
};

export const currentYear = new Date().getFullYear();

export const staggerContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export const fadeUpAnimationVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 18 } },
};
