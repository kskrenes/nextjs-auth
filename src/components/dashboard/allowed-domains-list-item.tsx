import { useTruncation } from '@/hooks/use-truncation';
import { Bold, Flex, ListItem } from '@tremor/react'
import { CheckCircle2 } from 'lucide-react'
import React from 'react'

interface AllowedDomainsListItemProps {
  domain: string;
}
const AllowedDomainsListItem = ({ domain }: AllowedDomainsListItemProps) => {
  const { elementRef, isTruncated } = useTruncation();
  return (
    <ListItem className="py-3 border-tremor-lat">
      <Flex>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 shrink-0 bg-foreground-excellent rounded-full" />
          <Bold 
            ref={elementRef as React.RefObject<HTMLElement>}
            title={isTruncated ? `@${domain}` : undefined}
            className="text-foreground-primary font-mono text-sm break-all line-clamp-1"
          >
            @{domain}
          </Bold>
        </div>
        <CheckCircle2 className="w-4 h-4 shrink-0 text-foreground-excellent" />
      </Flex>
    </ListItem>
  )
}

export default AllowedDomainsListItem