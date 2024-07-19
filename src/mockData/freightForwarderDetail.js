export const mockFreightForwarderDetail = {
    id: 2,
    name: "Swift Shipping Solutions",
    logo: "https://logo.clearbit.com/maersk.com",
    phoneNumber: "+1 (555) 123-4567",
    email: "info@swiftshipping.com",
    website: "https://www.swiftshipping.com",
    employees: 75,
    status: "active",
    description: "Swift Shipping Solutions is a leading freight forwarding company specializing in sea and road transportation. With over a decade of experience, we pride ourselves on providing efficient, reliable, and cost-effective logistics solutions to businesses worldwide. Our team of 75 dedicated professionals ensures smooth operations and exceptional customer service, handling over 830 successful shipments to date.",
    rating: 4.2,
    ordersCompleted: 830,
    isVerified: true,
    services: ["sea", "road"],
    employeeList: [
      { id: 1, name: "John Doe", email: "john@swiftshipping.com", phone: "+1 (555) 111-2222", role: "CEO", isPrimaryContact: true },
      { id: 2, name: "Jane Smith", email: "jane@swiftshipping.com", phone: "+1 (555) 222-3333", role: "Operations Manager", isPrimaryContact: false },
      { id: 3, name: "Bob Johnson", email: "bob@swiftshipping.com", phone: "+1 (555) 333-4444", role: "Logistics Coordinator", isPrimaryContact: false },
    ],
    documents: [
      { name: "Business License", url: "/documents/business-license.pdf" },
      { name: "Insurance Certificate", url: "/documents/insurance-certificate.pdf" },
      { name: "Quality Certification", url: "/documents/quality-certification.pdf" },
    ]
};