import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User } from "lucide-react";

interface UserNameDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
}

export const UserNameDialog = ({ open, onSubmit }: UserNameDialogProps) => {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border/50">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to AI Chat
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please enter your name to start chatting with our AI assistant.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="bg-muted/50 border-border/50 focus:border-primary/50"
            autoFocus
          />
          <Button 
            type="submit" 
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            Start Chatting
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};