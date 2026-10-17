import { PersonalPages } from "./PersonalPages";
import { AccountInformation } from "./AccountInformation";
import { SectionTabs } from "../components/SectionTabs";
import { navigate, useNavigation } from "../app/useNavigation";
export function Personalization() {
  const { personalization: view } = useNavigation();
  return (
    <div className="feature-stack">
      <SectionTabs
        label="Personalization sections"
        value={view}
        onChange={(personalization) => navigate({ personalization })}
        options={[
          ["pages", "Personal pages"],
          ["account", "Account information"],
        ]}
      />
      <div hidden={view !== "pages"}>
        <PersonalPages />
      </div>
      <div hidden={view !== "account"}>
        <AccountInformation />
      </div>
    </div>
  );
}
