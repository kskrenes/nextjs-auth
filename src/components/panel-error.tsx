import { AlertCircle } from 'lucide-react'

interface PanelErrorProps {
  message: string;
}

const PanelError = ({ message }: PanelErrorProps) => {
  return (
    <div className="bg-panel-poor border border-panel-poor-border rounded-md p-3 flex items-center gap-2">
      <AlertCircle className="w-5 h-5 text-poor mt-0.5 shrink-0" />
      <p className="text-sm text-foreground-poor">{message}</p>
    </div>
  )
}

export default PanelError