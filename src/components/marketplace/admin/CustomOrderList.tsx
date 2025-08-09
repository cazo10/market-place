import { Table, TableBody, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import CustomOrderListItem from './CustomOrderListItem';
import { CustomOrder } from '@/types';

interface CustomOrderListProps {
  orders: CustomOrder[];
  onOrderSelect: (order: CustomOrder) => void;
}

export default function CustomOrderList({ orders, onOrderSelect }: CustomOrderListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Requested By</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map(order => (
          <CustomOrderListItem 
            key={order.id} 
            order={order} 
            onClick={() => onOrderSelect(order)} 
          />
        ))}
      </TableBody>
    </Table>
  );
}