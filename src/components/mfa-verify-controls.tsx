import Button from "./nae-button";
import NaeLoader from "./nae-loader";

interface MFAVerifyControlsProps {
  onCancel: () => void;
  onVerify: () => void;
  loading: boolean;
  disabled: boolean;
  danger?: boolean;
}

const MFAVerifyControls = ({ onCancel, onVerify, loading, disabled, danger = false }: MFAVerifyControlsProps) => {
  return (
    <>
      <Button
        onClick={onCancel}
        disabled={loading}
        variant="secondary"
      >
        Cancel
      </Button>
      {loading ? (
        <Button
          onClick={onVerify}
          disabled={loading}
          variant={danger ? 'extreme' : 'primary'}
          className="button-loader"
        >
          <NaeLoader />
          Verifying...
        </Button>
      ) : (
        <Button
          onClick={onVerify}
          disabled={disabled}
          variant={danger ? 'extreme' : 'primary'}
        >
          Verify
        </Button>
      )}
      
    </>
  )
}

export default MFAVerifyControls