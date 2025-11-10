import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-sm',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground active:bg-accent/80 dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 shadow-sm',
        success:
          'bg-[#729b63] text-white hover:bg-[#8fb47f] active:bg-[#5d804f] shadow-sm',
        gold:
          'bg-[#f6ad55] text-[#1a1a1a] hover:bg-[#f99d4e] active:bg-[#f47420] shadow-sm font-semibold',
        ghost:
          'hover:bg-accent hover:text-accent-foreground active:bg-accent/80 dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2.5 text-base md:h-10 md:px-4 md:text-sm has-[>svg]:px-4 md:has-[>svg]:px-3',
        sm: 'h-10 px-4 py-2 text-sm md:h-9 md:px-3 md:text-sm rounded-md gap-1.5 has-[>svg]:px-3 md:has-[>svg]:px-2.5',
        lg: 'h-12 px-7 py-3 text-base md:h-11 md:px-6 md:text-base rounded-md has-[>svg]:px-5 md:has-[>svg]:px-4',
        icon: 'size-11 md:size-10',
        'icon-sm': 'size-10 md:size-9',
        'icon-lg': 'size-12 md:size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
