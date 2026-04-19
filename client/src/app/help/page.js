import { HelpCircle, Phone, Mail, MapPin } from "lucide-react";

export default function HelpPage() {
  const helpTopics = [
    {
      title: "Adoption Process",
      description: "Learn about the steps to adopt a pet from FurryFinds.",
      icon: <HelpCircle size={32} />
    },
    {
      title: "Pet Care Tips",
      description: "Get advice on caring for your new furry friend.",
      icon: <HelpCircle size={32} />
    },
    {
      title: "Volunteer Information",
      description: "Find out how you can help at our shelter.",
      icon: <HelpCircle size={32} />
    },
    {
      title: "Donation Guidelines",
      description: "Information on how to support our mission.",
      icon: <HelpCircle size={32} />
    },
  ];

  return (
    <main className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Help & Support</h1>
      <div className="services-grid">
        {helpTopics.map((topic, i) => (
          <div key={i} className="service-card">
            <div className="service-icon">{topic.icon}</div>
            <h3>{topic.title}</h3>
            <p>{topic.description}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <h2>Contact Us for More Help</h2>
        <div className="row center gap-sm" style={{ marginTop: '1rem' }}>
          <div className="row center gap-xs">
            <Phone size={20} />
            <span>+91 98765 43210</span>
          </div>
          <div className="row center gap-xs">
            <Mail size={20} />
            <span>help@furryfinds.com</span>
          </div>
          <div className="row center gap-xs">
            <MapPin size={20} />
            <span>New Valley Bhandup, Mumbai, Maharashtra</span>
          </div>
        </div>
      </div>
    </main>
  );
}