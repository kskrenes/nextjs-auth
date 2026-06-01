interface PanelHeaderProps {
  title: string;
  description: string;
}

const PanelHeader = ({ title, description }: PanelHeaderProps) => {
  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold mb-2">
        {title}
      </h1>
      <p className="text-sm text-foreground-secondary">
        {description}
      </p>
    </div>
  )
}

export default PanelHeader