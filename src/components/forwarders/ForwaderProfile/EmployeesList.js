// components/forwarders/ForwaderEmployeeTable.js
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ForwarderEmployeeTable = ({ employees }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Email</TableHead>
        <TableHead>Job Title</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {employees?.map((employee) => (
        <TableRow key={employee.id}>
          <TableCell>{`${employee.user.first_name} ${employee.user.last_name}`}</TableCell>
          <TableCell>{employee.user.email}</TableCell>
          <TableCell>{employee.job_title}</TableCell>
          <TableCell>
            <Badge 
              variant="outline" 
              className={employee.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            >
              {employee.is_active ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
        </TableRow>
      ))}
      {(!employees || employees.length === 0) && (
        <TableRow>
          <TableCell colSpan={5} className="text-center py-4">
            No employees found
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
);

export default ForwarderEmployeeTable;