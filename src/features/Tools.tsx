import { SectionTabs } from "../components/SectionTabs";
import { navigate, useNavigation } from "../app/useNavigation";
import { Names } from "./Names";
import { ScriptsAndLogs } from "./ScriptsAndLogs";
import type { HelperState } from "../core/shop-helper";
export function Tools({ helper }: { helper: HelperState }) {
  const { tools = "app" } = useNavigation();
  return (
    <div className="feature-stack">
      <SectionTabs
        label="Tools sections"
        value={tools}
        onChange={(tools) => navigate({ tools })}
        options={[
          ["app", "App scripts"],
          ["tampermonkey", "Tampermonkey scripts"],
          ["names", "Pet Hunt"],
        ]}
      />
      {tools === "names" ? (
        <Names />
      ) : (
        <ScriptsAndLogs key={tools} helper={helper} section={tools} />
      )}
    </div>
  );
}
