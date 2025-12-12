import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    // Also scan globals.css for class references
    './src/app/globals.css',
	],
  // Safelist custom classes that might be purged
  safelist: [
    // Navigation
    'nav', 'nav-container', 'nav-content', 'nav-logo', 'nav-logo-icon', 'nav-logo-text',
    'nav-links', 'nav-link', 'nav-actions',
    // Buttons
    'btn', 'btn-primary', 'btn-secondary', 'btn-success', 'btn-danger', 'btn-ghost',
    'btn-hero-primary', 'btn-hero-secondary',
    // Hero
    'hero', 'hero-container', 'hero-content', 'hero-badge', 'hero-badge-dot', 
    'hero-badge-text', 'hero-title', 'hero-highlight', 'hero-description', 'hero-actions',
    // Features
    'features', 'features-container', 'features-header', 'features-title', 
    'features-subtitle', 'features-grid', 'feature-card', 'feature-icon',
    'feature-title', 'feature-description',
    // Pricing
    'pricing', 'pricing-container', 'pricing-header', 'pricing-title', 
    'pricing-subtitle', 'pricing-grid', 'pricing-card', 'pricing-name',
    'pricing-price', 'pricing-period', 'pricing-features', 'pricing-cta', 'popular',
    // Testimonials
    'testimonials', 'testimonials-container', 'testimonials-header', 
    'testimonials-title', 'testimonials-subtitle', 'testimonials-grid',
    'testimonial-card', 'testimonial-content', 'testimonial-author',
    'testimonial-avatar', 'testimonial-info',
    // FAQ
    'faq', 'faq-container', 'faq-header', 'faq-title', 'faq-item',
    'faq-question', 'faq-answer',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
