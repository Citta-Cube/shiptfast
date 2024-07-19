// components/forwarders/information/ForwarderContactInfo.js
import { Phone, Mail, Globe, Users } from 'lucide-react';

const ForwarderContactInfo = ({ forwarder }) => (
  <div className="grid grid-cols-2 gap-4 mb-6">
    <div className="flex items-center">
      <Phone className="h-5 w-5 text-gray-400 mr-2" />
      <span>{forwarder.phoneNumber}</span>
    </div>
    <div className="flex items-center">
      <Mail className="h-5 w-5 text-gray-400 mr-2" />
      <span>{forwarder.email}</span>
    </div>
    <div className="flex items-center">
      <Globe className="h-5 w-5 text-gray-400 mr-2" />
      <a href={forwarder.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
        {forwarder.website}
      </a>
    </div>
    <div className="flex items-center">
      <Users className="h-5 w-5 text-gray-400 mr-2" />
      <span>{forwarder.employees} employees</span>
    </div>
    <div className="border-t pt-4 col-span-2">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        About {forwarder.name}
      </h3>
      <p className="text-gray-600">
        {forwarder.description}
      </p>
    </div>
  </div>
);

export default ForwarderContactInfo;