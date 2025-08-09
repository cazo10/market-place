
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Truck, Package } from 'lucide-react';

const OrderTracking = ({ order }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'processing':
        return 'blue';
      case 'shipped':
        return 'purple';
      case 'delivered':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Pending';
    }
  };

  const trackingSteps = [
    { 
      status: 'pending', 
      label: 'Order Placed', 
      time: order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt
    },
    { 
      status: 'processing', 
      label: 'Processing', 
      time: order.processingAt?.toDate ? order.processingAt.toDate() : order.processingAt
    },
    { 
      status: 'shipped', 
      label: 'Shipped', 
      time: order.shippedAt?.toDate ? order.shippedAt.toDate() : order.shippedAt
    },
    { 
      status: 'delivered', 
      label: 'Delivered', 
      time: order.deliveredAt?.toDate ? order.deliveredAt.toDate() : order.deliveredAt
    }
  ];

  const currentStatusIndex = trackingSteps.findIndex(step => step.status === order.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            Order Tracking
          </CardTitle>
          <Badge variant="outline" className={`text-${getStatusColor(order.status)}-600`}>
            {getStatusText(order.status || 'pending').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Order ID: #{order.id?.slice(-8)}</p>
            <p className="text-sm text-muted-foreground">
              Estimated delivery: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>
          
          <div className="space-y-3">
            {trackingSteps.map((step, index) => (
              <div key={step.status} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStatusIndex ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {index <= currentStatusIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    index <= currentStatusIndex ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </p>
                  {step.time && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(step.time).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderTracking;
