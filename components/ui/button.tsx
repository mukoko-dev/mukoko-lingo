import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[1.1rem] font-medium transition-all duration-200 ease-out hover:-translate-y-[3px] disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-[#5f5873] text-white hover:bg-[#7c73e6] active:bg-[#4a4560] shadow-button hover:shadow-button-hover rounded-[8px] dark:bg-[#7c73e6] dark:hover:bg-[#9186ae] dark:active:bg-[#5f5873]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 shadow-button hover:shadow-button-hover rounded-[8px]',
        outline:
          'border border-border bg-card hover:bg-[#fef5f3] hover:text-foreground active:bg-[#fde8e3] shadow-button hover:shadow-button-hover rounded-[8px] dark:bg-card dark:border-border dark:hover:bg-[#6b2b22]/20',
        secondary:
          'bg-[#729B63] text-white hover:bg-[#8FB47F] active:bg-[#5d804f] shadow-button hover:shadow-button-hover rounded-[8px] dark:bg-[#8FB47F] dark:hover:bg-[#a8d197] dark:active:bg-[#729B63]',
        success:
          'bg-[#729B63] text-white hover:bg-[#8FB47F] active:bg-[#5d804f] shadow-button hover:shadow-button-hover rounded-[8px]',
        gold:
          'bg-[#d4634a] text-white hover:bg-[#f18d79] active:bg-[#c54f37] shadow-button hover:shadow-button-hover rounded-[8px] font-semibold',
        'warm-brown':
          'bg-[#8B7355] text-white hover:bg-[#b69a81] active:bg-[#765f47] shadow-button hover:shadow-button-hover rounded-[8px] font-semibold',
        ghost:
          'hover:bg-muted hover:text-foreground active:bg-muted/80 dark:hover:bg-muted rounded-[8px]',
        link: 'text-[#5f5873] underline-offset-4 hover:underline dark:text-[#7c73e6] rounded-[8px]',
      },
      size: {
        default: 'px-8 py-4 h-auto has-[>svg]:px-7',
        sm: 'px-6 py-3 h-auto has-[>svg]:px-5',
        lg: 'px-10 py-5 h-auto has-[>svg]:px-9',
        icon: 'size-12 p-3',
        'icon-sm': 'size-10 p-2.5',
        'icon-lg': 'size-14 p-4',
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
