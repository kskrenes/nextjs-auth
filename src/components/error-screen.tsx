'use client';

export interface ErrorProps {
  reset?: () => void
}

interface ErrorScreenProps {
  reset?: () => void, 
  isCritical?: boolean,
}

const ErrorScreen = ({ reset, isCritical = false }: ErrorScreenProps) => {
  return (
    <div className="page-container">
      
      <h1 className="page-title-container page-title text-foreground-poor">
        Something went wrong!
      </h1>

      <div className="bg-panel-poor border border-panel-poor-border rounded-md p-3">
        
        <p className="text-sm text-foreground-poor mt-2">
          {isCritical 
            ? 'A critical system error occurred.' 
            : 'We encountered an unexpected error while loading this page. Please try again.'
          }
        </p>

        {reset && (
          <button
            onClick={() => reset()} // Tries to re-render the broken segment
            className="button-extreme button-small mt-4"
          >
            {isCritical 
              ? 'Critical Reset' 
              : 'Try Again'
            }
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorScreen;