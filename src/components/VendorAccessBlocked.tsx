import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Phone, Mail } from 'lucide-react';

const VendorAccessBlocked = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/10 via-background to-destructive/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Suspended Card */}
        <Card className="animate-scale-in">
          <CardHeader className="text-center">
            <div className="h-12 w-12 bg-destructive rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Account Suspended
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Your vendor account has been deactivated by the administrator due to inactivity or policy violation.
            </p>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              If you believe this is a mistake or want to reactivate your account, please contact support:
            </p>

            {/* Contact Information */}
            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg">
              <h3 className="font-semibold text-sm">Contact Support</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>0788 500 249</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>sokocamp@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Home Button */}
            <Link to="/">
              <Button variant="outline" className="w-full">
                Return to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorAccessBlocked;
