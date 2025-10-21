import { AlertCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClientErrorResponse } from '@/lib/types/errors';

interface ErrorAlertProps {
  error: ClientErrorResponse;
  onRetry?: () => void;
  onUpgrade?: () => void;
  onSignup?: () => void;
  className?: string;
}

export function ErrorAlert({
  error,
  onRetry,
  onUpgrade,
  onSignup,
  className,
}: ErrorAlertProps) {
  const icon = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[error.severity];

  const Icon = icon;

  const variant = {
    error: 'destructive' as const,
    warning: 'warning' as const,
    info: 'info' as const,
  }[error.severity];

  const getActionButton = () => {
    switch (error.action) {
      case 'retry':
        return onRetry ? (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        ) : null;

      case 'upgrade_required':
        return onUpgrade ? (
          <Button onClick={onUpgrade} size="sm">
            Upgrade Now
          </Button>
        ) : error.details?.upgradeUrl ? (
          <Button asChild size="sm">
            <a href={error.details.upgradeUrl}>Upgrade Now</a>
          </Button>
        ) : null;

      case 'signup_required':
        return onSignup ? (
          <Button onClick={onSignup} size="sm">
            Create Free Account
          </Button>
        ) : error.details?.upgradeUrl ? (
          <Button asChild size="sm">
            <a href={error.details.upgradeUrl}>Create Free Account</a>
          </Button>
        ) : null;

      case 'wait':
        return error.details?.retryAfter ? (
          <p className="text-sm text-muted-foreground mt-2">
            Please wait until {new Date(error.details.retryAfter).toLocaleTimeString()}
          </p>
        ) : null;

      case 'contact_support':
        return error.details?.supportEmail ? (
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${error.details.supportEmail}`}>Contact Support</a>
          </Button>
        ) : null;

      case 'check_input':
        return null;

      default:
        return null;
    }
  };

  const actionButton = getActionButton();

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{error.error}</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        {error.details?.reason && (
          <p className="text-sm text-muted-foreground mt-2">{error.details.reason}</p>
        )}
        {error.details?.documentationUrl && (
          <p className="text-sm mt-2">
            <a
              href={error.details.documentationUrl}
              className="underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more about verified contracts
            </a>
          </p>
        )}
        {actionButton && <div className="mt-4">{actionButton}</div>}
      </AlertDescription>
    </Alert>
  );
}
