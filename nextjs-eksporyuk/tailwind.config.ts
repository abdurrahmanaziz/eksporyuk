import type { Config } from "tailwindcss"

// Eksporyuk Tailwind Configuration - Force rebuild 25 Dec 2025 v2
const config = {
  // darkMode: ["class"], // dark mode disabled
  content: [
    './pages/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './app/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx,mdx}',
    // Include node_modules for shadcn/ui components
    './node_modules/@radix-ui/**/*.{js,ts,jsx,tsx}',
	],
  // Safelist ALL commonly used utilities to ensure they're generated
  safelist: [
    // Layout
    'flex', 'grid', 'block', 'inline', 'inline-flex', 'inline-block', 'hidden',
    'flex-col', 'flex-row', 'flex-wrap', 'flex-1', 'flex-auto', 'flex-none',
    'items-center', 'items-start', 'items-end', 'items-stretch',
    'justify-center', 'justify-start', 'justify-end', 'justify-between', 'justify-around',
    'self-center', 'self-start', 'self-end', 'self-stretch',
    // Sizing
    'w-full', 'w-auto', 'w-screen', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
    'h-full', 'h-auto', 'h-screen', 'min-h-screen', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl',
    // Spacing
    'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
    'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-5', 'px-6', 'px-8', 'px-10', 'px-12',
    'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-10', 'py-12',
    'pt-0', 'pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-6', 'pt-8',
    'pb-0', 'pb-1', 'pb-2', 'pb-3', 'pb-4', 'pb-6', 'pb-8',
    'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-auto',
    'mx-0', 'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-auto',
    'my-0', 'my-1', 'my-2', 'my-3', 'my-4', 'my-6', 'my-8',
    'mt-0', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-6', 'mt-8',
    'mb-0', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-6', 'mb-8',
    'gap-0', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8',
    'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4',
    'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-6',
    // Typography
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
    'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    'text-left', 'text-center', 'text-right',
    'text-white', 'text-black', 'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300',
    'text-gray-400', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'text-blue-500', 'text-blue-600', 'text-blue-700',
    'text-red-500', 'text-red-600', 'text-green-500', 'text-green-600',
    'text-orange-500', 'text-orange-600', 'text-orange-700',
    // Background
    'bg-white', 'bg-black', 'bg-transparent',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500',
    'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
    'bg-red-50', 'bg-red-100', 'bg-red-500', 'bg-red-600',
    'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-500', 'bg-orange-600',
    // Border
    'border', 'border-0', 'border-2', 'border-4',
    'border-t', 'border-b', 'border-l', 'border-r',
    'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-gray-400',
    'border-blue-500', 'border-red-500', 'border-green-500',
    'border-transparent', 'border-input',
    'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full', 'rounded-none',
    // Shadow
    'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-none',
    // Ring
    'ring', 'ring-1', 'ring-2', 'ring-4', 'ring-offset-2',
    'ring-blue-500', 'ring-gray-300', 'ring-offset-background',
    'focus:ring-2', 'focus:ring-blue-500', 'focus:ring-offset-2',
    'focus-visible:ring-2', 'focus-visible:ring-ring', 'focus-visible:ring-offset-2',
    // Transitions
    'transition', 'transition-all', 'transition-colors', 'transition-opacity', 'transition-transform',
    'duration-150', 'duration-200', 'duration-300',
    'ease-in', 'ease-out', 'ease-in-out',
    // Opacity
    'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
    // Cursor
    'cursor-pointer', 'cursor-default', 'cursor-not-allowed',
    // Position
    'relative', 'absolute', 'fixed', 'sticky',
    'top-0', 'right-0', 'bottom-0', 'left-0', 'inset-0',
    'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
    // Overflow
    'overflow-hidden', 'overflow-auto', 'overflow-scroll', 'overflow-x-auto', 'overflow-y-auto',
    // Hover states
    'hover:bg-gray-50', 'hover:bg-gray-100', 'hover:bg-gray-200',
    'hover:bg-blue-600', 'hover:bg-blue-700',
    'hover:bg-orange-600', 'hover:bg-orange-700',
    'hover:text-gray-600', 'hover:text-gray-700', 'hover:text-gray-900',
    'hover:text-blue-600', 'hover:text-blue-700',
    'hover:text-orange-600', 'hover:text-orange-700',
    'hover:shadow-md', 'hover:shadow-lg',
    'hover:opacity-80', 'hover:opacity-90',
    // Focus states
    'focus:outline-none', 'focus:ring', 'focus:border-blue-500',
    // Disabled states
    'disabled:opacity-50', 'disabled:cursor-not-allowed', 'disabled:pointer-events-none',
    // Custom classes for landing page
    'nav', 'nav-container', 'nav-content', 'nav-logo', 'nav-logo-icon', 'nav-logo-text',
    'nav-links', 'nav-link', 'nav-actions',
    'btn', 'btn-primary', 'btn-secondary', 'btn-success', 'btn-danger', 'btn-ghost',
    'btn-hero-primary', 'btn-hero-secondary',
    'hero', 'hero-container', 'hero-content', 'hero-badge', 'hero-badge-dot',
    'hero-badge-text', 'hero-title', 'hero-highlight', 'hero-description', 'hero-actions',
    'features', 'features-container', 'features-header', 'features-title',
    'features-subtitle', 'features-grid', 'feature-card', 'feature-icon',
    'feature-title', 'feature-description',
    'pricing', 'pricing-container', 'pricing-header', 'pricing-title',
    'pricing-subtitle', 'pricing-grid', 'pricing-card', 'pricing-name',
    'pricing-price', 'pricing-period', 'pricing-features', 'pricing-cta', 'popular',
    'testimonials', 'testimonials-container', 'testimonials-header',
    'testimonials-title', 'testimonials-subtitle', 'testimonials-grid',
    'testimonial-card', 'testimonial-content', 'testimonial-author',
    'testimonial-avatar', 'testimonial-info',
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
          foreground: "hsl(var(--primary-foreground))",
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
