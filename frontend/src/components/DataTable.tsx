import React from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Text,
} from '@chakra-ui/react';
import { useTable, useSortBy, Column, HeaderGroup, Row, Cell } from 'react-table';

interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  isReadOnly?: boolean;
}

function DataTable<T extends object>({ columns, data, isReadOnly = false }: DataTableProps<T>) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data }, useSortBy);

  return (
    <TableContainer>
      <Table {...getTableProps()} variant="striped" colorScheme="gray" size="sm">
        <Thead>
          {headerGroups.map((headerGroup: HeaderGroup<T>) => (
            <Tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column: any) => (
                <Th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? ' 🔽'
                        : ' 🔼'
                      : ''}
                  </span>
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {rows.map((row: Row<T>) => {
            prepareRow(row);
            return (
              <Tr {...row.getRowProps()}>
                {row.cells.map((cell: Cell<T>) => (
                  <Td {...cell.getCellProps()}>{cell.render('Cell')}</Td>
                ))}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
      {rows.length === 0 && (
        <Box textAlign="center" p={5}>
          <Text>No data available.</Text>
        </Box>
      )}
    </TableContainer>
  );
}

export default DataTable;