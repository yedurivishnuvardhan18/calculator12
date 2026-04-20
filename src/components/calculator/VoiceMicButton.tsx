interface VoiceMicButtonProps {
  onResult: (value: string) => void;
  type: "number" | "grade" | "text";
  min?: number;
  max?: number;
  className?: string;
}

export function VoiceMicButton(_props: VoiceMicButtonProps) {
  return null;
}
