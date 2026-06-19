import { cn } from '@/helpers/util/classname-util'
import Link from 'next/link'

interface LogoLinkProps {
  overrideTheme?: boolean;
}

const LogoLink = ({ overrideTheme = false }: LogoLinkProps) => {

  const logo = overrideTheme ? 'bg-white-logo' : 'bg-logo';
  const logoText = overrideTheme ? 'text-landing' : '';

  return (
    <Link href="/" aria-label="Home" className="flex select-none items-center gap-2 m-4">
      <div aria-hidden="true" className={cn('w-7.25 h-7.25 bg-contain bg-no-repeat', logo)} />
      <span className={cn('hidden sm:block text-lg font-bold', logoText)}>
        nAuth
      </span>
    </Link>
  )
}

export default LogoLink