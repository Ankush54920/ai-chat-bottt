import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type AIModel = "Mysterious 1" | "Mysterious 2" | "Genius";

interface AISelectorProps {
  selectedAI: AIModel;
  onSelectionChange: (ai: AIModel) => void;
}

export const AISelector = ({ selectedAI, onSelectionChange }: AISelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">AI Model:</span>
      <Select value={selectedAI} onValueChange={onSelectionChange}>
        <SelectTrigger className="w-40 bg-card/50 border-border/30">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border-border/30">
          <SelectItem value="Mysterious 1">Mysterious 1</SelectItem>
          <SelectItem value="Mysterious 2">Mysterious 2</SelectItem>
          <SelectItem value="Genius">Genius</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};