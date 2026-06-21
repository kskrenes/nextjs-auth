import { PasskeyDTO } from "@/helpers/dto/passkey-dto";
import PasskeyItem from "./passkey-item";

export interface PasskeyManagementProps {
  passkeys: PasskeyDTO[];
  onUpdate: (id: string, nickname: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const PasskeyManagement = ({ passkeys, onUpdate, onDelete }: PasskeyManagementProps) => {
  return (
    <div className="-mt-2 ml-17 mr-5 xs:mr-26 mb-4 space-y-2">
      {passkeys.map((pk) => (
        <PasskeyItem key={pk.id} pk={pk} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  )
}

export default PasskeyManagement