import { Loader2 } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

interface NaeLoaderProps {
  className?: string
}

const NaeLoader = ({className = ''}: NaeLoaderProps) => {
  return (
    <Loader2 className={twMerge('w-7 h-7 animate-spin text-brand', className)} />
  )
}

export default NaeLoader