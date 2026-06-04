import { CheckCircle } from 'lucide-react'

interface PanelSuccessProps {
  message: string;
}

const PanelSuccess = ({ message }: PanelSuccessProps) => {
  return (
    <div className="bg-panel-excellent border border-panel-excellent-border rounded-md p-3 flex items-center gap-2">
      <CheckCircle className="w-5 h-5 text-excellent mt-0.5 shrink-0" />
      <p className="text-sm text-foreground-excellent">{message}</p>
    </div>
  )
}

export default PanelSuccess