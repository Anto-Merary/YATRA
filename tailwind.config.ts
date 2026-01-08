import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
  	extend: {
  			fontFamily: {
  			sans: [
  				"Inter",
  				"ui-sans-serif",
  				"system-ui",
  				"-apple-system",
  				"Segoe UI",
  				"Roboto",
  				"Arial",
  				"Apple Color Emoji",
  				"Segoe UI Emoji"
  			],
  			display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui"],
  			script: ["Dancing Script", "Playfair Display", "cursive"],
  			serif: ["Playfair Display", "serif"],
  			akira: ["Akira Expanded", "Impact", "Arial Black", "sans-serif"],
  			montserrat: ["Montserrat", "sans-serif"],
  			korean: ["Noto Sans KR", "Malgun Gothic", "sans-serif"]
  		},
  		colors: {
  			yatra: {
  				'50': '#f5f4ff',
  				'100': '#ecebff',
  				'200': '#d9d7ff',
  				'300': '#b9b4ff',
  				'400': '#8f86ff',
  				'500': '#6a5cff',
  				'600': '#5745ff',
  				'700': '#4730ea',
  				'800': '#3b28c3',
  				'900': '#31249b'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")]
} satisfies Config;


