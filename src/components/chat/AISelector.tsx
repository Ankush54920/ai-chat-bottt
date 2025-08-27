import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AIMode = "Study Mode" | "Research Mode" | "Creative Mode" | "Fun Mode" | "Debate Mode";

interface AISelectorProps {
  selectedMode: AIMode;
  onSelectionChange: (mode: AIMode) => void;
}

export const AISelector = ({ selectedMode, onSelectionChange }: AISelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Mode:</span>
      <Select value={selectedMode} onValueChange={onSelectionChange}>
        <SelectTrigger className="w-56 bg-card/80 backdrop-blur-sm border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50 z-50">
          <SelectItem value="Study Mode">📚 Study Mode (Tutor)</SelectItem>
          <SelectItem value="Research Mode">🔍 Research Mode (Latest info)</SelectItem>
          <SelectItem value="Creative Mode">🎨 Creative Mode (Brainstorming)</SelectItem>
          <SelectItem value="Fun Mode">😄 Fun Mode (Friendly Chat)</SelectItem>
          <SelectItem value="Debate Mode">⚖️ Debate Mode (Critical Thinking)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};