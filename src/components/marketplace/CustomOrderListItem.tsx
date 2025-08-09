import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CustomOrder } from '@/types';

interface CustomOrderListItemProps {
  order: CustomOrder;
  onClick: () => void;
}

export default function CustomOrderListItem({ order, onClick }: CustomOrderListItemProps) {
  return (
    <TableRow>
      <TableCell>{order.productName}</TableCell>
      <TableCell>{order.category}</TableCell>
      <TableCell>{order.userName || 'Guest'}</TableCell>
      <TableCell>
        <Badge variant={
          order.status === 'completed' ? 'default' : 
          order.status === 'processing' ? 'secondary' : 'outline'
        }>
          {order.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button size="sm" variant="outline" onClick={onClick}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}