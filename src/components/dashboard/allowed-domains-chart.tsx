import { Bold, Card, Flex, List, ListItem, Text } from '@tremor/react'
import { CheckCircle2, Mail } from 'lucide-react'

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
          <ListItem key={index} className="py-3 border-tremor-lat">
            <Flex>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-foreground-excellent rounded-full" />
                <Bold className="text-foreground-primary font-mono text-sm">@{domain}</Bold>
              </div>
              <CheckCircle2 className="w-4 h-4 text-foreground-excellent" />
            </Flex>
          </ListItem>
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