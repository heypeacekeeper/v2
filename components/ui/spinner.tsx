import React from "react"
import { Rocket } from 'lucide-react'

import { cn } from '@/lib/utils'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Rocket
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-bounce', className)}
      {...props}
    />
  )
}

export { Spinner }
