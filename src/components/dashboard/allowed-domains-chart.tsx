import { Card, List, Text } from '@tremor/react'
import { Mail } from 'lucide-react'
import AllowedDomainsListItem from './allowed-domains-list-item';

// mock data
const allowedDomains = [
  'company.com',
  'partner.com',
  'contractor.com',
];

const AllowedDomainsChart = () => {
  return (
    <Card className="bg-page shadow-none ring-0">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-page-good rounded-lg">
          <Mail className="w-5 h-5 text-foreground-good" />
        </div>
        <div>
          <Text className="font-medium mb-1 text-foreground-primary">Allowed Email Domains</Text>
          <Text className="text-foreground-secondary text-sm mt-1">
            Only users with these domains can sign up
          </Text>
        </div>
      </div>

      <List className="mt-4">
        {allowedDomains.map((domain, index) => (
          <AllowedDomainsListItem key={index} domain={domain} />
        ))}
      </List>

      <div className="mt-5 pt-3 border-t border-tremor-lat">
        <Text className="text-xs text-foreground-secondary">
          <span className="font-medium">{allowedDomains.length}</span> domains configured
        </Text>
      </div>
    </Card>
  )
}

export default AllowedDomainsChart