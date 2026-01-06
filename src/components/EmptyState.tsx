import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: string[];
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  suggestions,
  children
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      
      {suggestions && suggestions.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4 mb-6 max-w-md">
          <p className="text-sm font-medium mb-2">Try asking:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="italic">"{suggestion}"</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex gap-3">
        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
      
      {children}
    </motion.div>
  );
}

// Pre-built empty states for common views
export const emptyStates = {
  chat: {
    title: 'Start a conversation',
    description: 'Your AI business advisor is ready to help you make better decisions.',
    suggestions: [
      'What should I focus on this week?',
      'Help me close this $5k deal',
      'Review my pricing strategy'
    ]
  },
  leads: {
    title: 'No leads yet',
    description: 'Leads will appear when the Demand Engine captures interest or you import from your CRM.'
  },
  approvals: {
    title: 'All caught up!',
    description: 'No pending approvals. The AI is executing within your pre-approved limits.'
  },
  revenue: {
    title: 'No revenue tracked yet',
    description: 'Revenue will appear after your first sale is recorded via Stripe or manual entry.'
  },
  decisions: {
    title: 'No decisions yet',
    description: 'Start chatting with Alpha Vision to generate your first AI-powered recommendation.'
  },
  actions: {
    title: 'No actions executed',
    description: 'Approved actions and their results will appear here.'
  }
};

export default EmptyState;
