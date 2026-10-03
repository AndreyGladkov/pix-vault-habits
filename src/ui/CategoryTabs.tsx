import { tabKey, type CategoryTab } from "../categories";
import { t } from "../i18n";
import { HorizontalScroller } from "./HorizontalScroller";
import { Pressable } from "./Pressable";

interface CategoryTabsProps {
  tabs: CategoryTab[];
  activeTab: CategoryTab;
  onSelect: (tab: CategoryTab) => void;
  onAddCategory: () => void;
  onRenameCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
}

export const CategoryTabs = ({
  tabs,
  activeTab,
  onSelect,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
}: CategoryTabsProps) => (
  <HorizontalScroller className="pvhabits-tabs-scroller" wheelScrolls>
    <div className="pvhabits-tabs" role="tablist">
      {tabs.map((tab) => {
        const active = tabKey(tab) === tabKey(activeTab);
        return (
          <div
            key={tabKey(tab)}
            role="presentation"
            className={`pvhabits-tab${active ? " is-active" : ""}`}
          >
            <Pressable
              role="tab"
              selected={active}
              className="pvhabits-tab-label"
              onPress={() => onSelect(tab)}
            >
              {tabLabel(tab)}
            </Pressable>
            {active && tab.type === "category" && (
              <>
                <Pressable
                  role="button"
                  className="pvhabits-tab-action"
                  label={t("modal.renameCategory.title")}
                  onPress={() => onRenameCategory(tab.name)}
                >
                  ✎
                </Pressable>
                <Pressable
                  role="button"
                  className="pvhabits-tab-action"
                  label={t("tabs.deleteCategoryAria")}
                  onPress={() => onDeleteCategory(tab.name)}
                >
                  ×
                </Pressable>
              </>
            )}
          </div>
        );
      })}
      <Pressable
        role="button"
        className="pvhabits-tab pvhabits-tab-add"
        label={t("tabs.addCategory")}
        onPress={onAddCategory}
      >
        +
      </Pressable>
    </div>
  </HorizontalScroller>
);

const tabLabel = (tab: CategoryTab): string => {
  switch (tab.type) {
    case "all":
      return t("tabs.all");
    case "uncategorized":
      return t("tabs.uncategorized");
    case "category":
      return tab.name;
  }
};
