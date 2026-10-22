import type { DomainConfig } from "@/lib/schemas";
import type { Domain } from "@/lib/schemas";
import banking from "./banking";
import insurance from "./insurance";
import subscriptions from "./subscriptions";
import ecommerce from "./ecommerce";
import travel from "./travel";

const DOMAINS: Record<Domain, DomainConfig> = {
  banking,
  insurance,
  subscriptions,
  ecommerce,
  travel,
};

export function getDomain(id: Domain): DomainConfig {
  return DOMAINS[id];
}

export function getAllDomains(): DomainConfig[] {
  return Object.values(DOMAINS);
}
