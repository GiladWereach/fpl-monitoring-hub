import React from 'react';
import {
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const TableHeader = () => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Player</TableHead>
        <TableHead>Team</TableHead>
        <TableHead className="text-right">Mins</TableHead>
        <TableHead className="text-right">G</TableHead>
        <TableHead className="text-right">A</TableHead>
        <TableHead className="text-right">CS</TableHead>
        <TableHead className="text-right">GC</TableHead>
        <TableHead className="text-right">OG</TableHead>
        <TableHead className="text-right">PS</TableHead>
        <TableHead className="text-right">PM</TableHead>
        <TableHead className="text-right">YC</TableHead>
        <TableHead className="text-right">RC</TableHead>
        <TableHead className="text-right">S</TableHead>
        <TableHead className="text-right">BPS</TableHead>
        <TableHead className="text-right">Pts</TableHead>
      </TableRow>
    </TableHeader>
  );
};