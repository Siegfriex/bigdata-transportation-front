import { SaveItemButton } from './SaveItemButton'

type SavePlaceButtonProps = {
  placeId: string
}

export function SavePlaceButton({ placeId }: SavePlaceButtonProps) {
  return <SaveItemButton targetType="place" targetId={placeId} />
}
