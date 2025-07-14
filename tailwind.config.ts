import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'kanit': ['Kanit', 'sans-serif'],
				'sarabun': ['Sarabun', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				welfare: {
					blue: '#4361EE',
					purple: '#7209B7',
					pink: '#F72585',
					orange: '#FB8500',
					teal: '#4CC9F0',
					green: '#06D6A0',
					yellow: '#FFCA3A',
					red: '#D90429',
				},
				dark: {
					'100': '#1E1E2E', // Base dark background
					'200': '#181825', // Darker elements
					'300': '#11111B', // Darkest elements
					'accent-1': '#313244', // Subtle accent
					'accent-2': '#45475A', // Stronger accent
					'blue': '#89B4FA',
					'lavender': '#B4BEFE',
					'purple': '#CBA6F7',
					'pink': '#F5C2E7',
					'teal': '#94E2D5',
					'green': '#A6E3A1',
					'yellow': '#F9E2AF',
					'peach': '#FAB387',
					'red': '#F38BA8',
					'overlay': 'rgba(30, 30, 46, 0.7)',
					'glass': 'rgba(30, 30, 46, 0.5)',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-in': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(0)'
					}
				},
				'bounce': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-5px)'
					}
				},
				'pulse-slow': {
					'0%, 100%': {
						opacity: '1'
					},
					'50%': {
						opacity: '0.8'
					}
				},
				'spin-slow': {
					'0%': {
						transform: 'rotate(0deg)'
					},
					'100%': {
						transform: 'rotate(360deg)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-500px 0'
					},
					'100%': {
						backgroundPosition: '500px 0'
					}
				},
				'aurora': {
					'0%, 100%': {
						opacity: '0.4',
						transform: 'scale(1.0) rotate(0deg)'
					},
					'50%': {
						opacity: '0.7',
						transform: 'scale(1.2) rotate(180deg)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-in': 'slide-in 0.5s ease-out',
				'bounce': 'bounce 2s ease-in-out infinite',
				'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
				'spin-slow': 'spin-slow 10s linear infinite',
				'float': 'float 6s ease-in-out infinite',
				'shimmer': 'shimmer 2s linear infinite',
				'aurora': 'aurora 15s ease-in-out infinite',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'gradient-primary': 'linear-gradient(90deg, #4361EE 0%, #7209B7 100%)',
				'gradient-secondary': 'linear-gradient(90deg, #F72585 0%, #7209B7 100%)',
				'gradient-accent': 'linear-gradient(90deg, #4CC9F0 0%, #4361EE 100%)',
				'dark-gradient': 'linear-gradient(to bottom, #1E1E2E, #181825)',
				'dark-radial': 'radial-gradient(circle at center, #1E1E2E 0%, #11111B 100%)',
				'dark-mesh': 'radial-gradient(at 40% 40%, rgba(139, 92, 246, 0.05) 0px, transparent 50%), radial-gradient(at 80% 10%, rgba(124, 58, 237, 0.05) 0px, transparent 50%), radial-gradient(at 10% 90%, rgba(192, 132, 252, 0.05) 0px, transparent 50%)',
				'dark-glow': 'linear-gradient(to right, #1E1E2E, #1E1E2E), radial-gradient(circle at top left, rgba(139, 92, 246, 0.12), transparent 25%), radial-gradient(circle at bottom right, rgba(139, 92, 246, 0.12), transparent 25%)',
				'dark-noise': 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
				'dark-grid': 'linear-gradient(to right, rgba(75, 85, 99, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(75, 85, 99, 0.05) 1px, transparent 1px)',
				'dark-dots': 'radial-gradient(rgba(75, 85, 99, 0.1) 1px, transparent 1px)',
				'aurora-bg': 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 25%, rgba(192, 132, 252, 0.15) 50%, rgba(139, 92, 246, 0.15) 75%, rgba(124, 58, 237, 0.15) 100%)',
				'glass-effect': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
