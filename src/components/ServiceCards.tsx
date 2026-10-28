import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Cable,
  CircuitBoard,
  ClipboardCheck,
  PlugZap,
  House,
  Lamp,
  Network,
  Building2,
} from "lucide-react";
import { SERVICES } from "@/lib/site";
export const serviceIcons = [Cable, CircuitBoard, ClipboardCheck, PlugZap, House, Lamp, Network];
export function ServiceCards() {
  return (
    <div className="service-cards">
      {SERVICES.map((service, i) => {
        const Icon = serviceIcons[i];
        return (
          <Link key={service.slug} to={service.path} className="service-card group">
            <span className="icon-tile">
              <Icon size={23} />
            </span>
            <h3>{service.title}</h3>
            <p>{service.short}</p>
            <span className="card-link">
              Explore service <ArrowRight size={16} />
            </span>
          </Link>
        );
      })}
      <Link to="/commercial" className="service-card group">
        <span className="icon-tile">
          <Building2 size={23} />
        </span>
        <h3>Commercial Electrical</h3>
        <p>Power, lighting, testing and refurbishment for working premises.</p>
        <span className="card-link">
          Explore service <ArrowRight size={16} />
        </span>
      </Link>
    </div>
  );
}
