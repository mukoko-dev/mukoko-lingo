import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "@/components/theme-switcher"

interface MarketingLayoutProps {
  children: React.ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/bee-logo-mobile.png"
                alt="Nyuchi Lingo"
                width={40}
                height={40}
                className="h-10 w-10 sm:hidden"
                priority
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nyuchi_Lingo_purple-NSHTsUuDVYaiijQqQGE4nwsgdvohEK.png"
                alt="Nyuchi Lingo"
                width={120}
                height={40}
                className="hidden sm:block h-10 w-auto dark:hidden"
                priority
              />
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Nyuchi_Lingo_dark-FQBxd4oyoOqOeVfmPZaNiczf3SVPz5.png"
                alt="Nyuchi Lingo"
                width={120}
                height={40}
                className="hidden sm:dark:block h-10 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-base font-serif font-medium text-foreground hover:text-primary-700 transition-colors">
                Features
              </Link>
              <Link href="/about" className="text-base font-serif font-medium text-foreground hover:text-primary-700 transition-colors">
                About
              </Link>
              <Link href="/why" className="text-base font-serif font-medium text-foreground hover:text-primary-700 transition-colors">
                Why Nyuchi Lingo
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="default" className="hidden sm:inline-flex font-serif">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="default" className="font-serif">
              <Link href="/auth/login">Start for free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t bg-[#2a2a2a] dark:bg-[#1a1a1a] py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Product */}
            <div>
              <h3 className="font-bold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/features" className="text-gray-300 hover:text-white transition-colors font-medium">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors font-medium">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/app/learn" className="text-gray-300 hover:text-white transition-colors font-medium">
                    Browse Phrases
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white transition-colors font-medium">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/why" className="text-gray-300 hover:text-white transition-colors font-medium">
                    Why Nyuchi Lingo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/ai-policy" className="text-gray-300 hover:text-white transition-colors font-medium">
                    AI Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-white transition-colors font-medium">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors font-medium">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-base text-gray-300 font-medium">
              © 2025 Nyuchi Learning. All rights reserved.
            </p>
            <p className="text-base italic text-gray-300 font-medium">"I am because we are" - Ubuntu</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
