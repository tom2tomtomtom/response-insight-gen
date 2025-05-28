
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface ApiKeyHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeyHelpDialog: React.FC<ApiKeyHelpDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About OpenAI API Keys</DialogTitle>
          <DialogDescription>
            Your API key is used to send requests to OpenAI's text analysis services. Here's what you need to know:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-medium">Privacy & Security</h3>
            <p className="text-sm text-muted-foreground">
              Your API key is stored locally in your browser and is never sent to our servers. All requests to OpenAI are made directly from your browser.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Usage & Billing</h3>
            <p className="text-sm text-muted-foreground">
              Using your OpenAI API key will incur charges based on your usage according to OpenAI's pricing. Make sure to monitor your usage on the OpenAI dashboard.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">How to Get an API Key</h3>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Visit <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">OpenAI's API Keys page</a></li>
              <li>Sign in or create an account</li>
              <li>Create a new API key</li>
              <li>Copy and paste the key here</li>
            </ol>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyHelpDialog;
