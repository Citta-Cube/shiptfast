// components/forwarders/ForwaderEmployeeTable.js
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ForwaderEmployeeTable = ({ employees }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Phone</TableHead>
        <TableHead>Role</TableHead>
        <TableHead>Primary Contact</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {employees.map((employee) => (
        <TableRow key={employee.id}>
          <TableCell>{employee.name}</TableCell>
          <TableCell>{employee.email}</TableCell>
          <TableCell>{employee.phone}</TableCell>
          <TableCell>{employee.role}</TableCell>
          <TableCell>
            {employee.isPrimaryContact && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Primary Contact
              </Badge>
            )}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default ForwaderEmployeeTable;