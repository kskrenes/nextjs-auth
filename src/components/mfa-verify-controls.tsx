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
      <Button
        onClick={onVerify}
        disabled={loading || disabled}
        className="gap-2"
        variant={danger ? 'extreme' : 'primary'}
      >
        {loading && <NaeLoader />}
        {loading ? 'Verifying...' : 'Verify'}
      </Button>
    </>
  )
}

export default MFAVerifyControls