import { useState } from "react";

import classNames from "classnames";

import { ITerm } from "@/lib/api";
import { Semester } from "@/lib/generated/graphql";

import styles from "./ClassBrowser.module.scss";
import Filters from "./Filters";
import List from "./List";
import { FilterContext } from "./context/FilterContext";
import { type CatalogLayoutMode, LayoutContext } from "./context/LayoutContext";
import { ListContext } from "./context/ListContext";
import useCatalogBrowser, {
  type UseCatalogBrowserReturn,
} from "./hooks/useCatalogBrowser";

interface ClassBrowserProps {
  onSelect: (
    subject: string,
    courseNumber: string,
    number: string,
    sessionId: string
  ) => void;
  forceMode?: CatalogLayoutMode;
  semester: Semester;
  year: number;
  terms?: ITerm[];
  persistent?: boolean;
  /** When provided, filter/search state is owned by the parent (survives unmount). */
  browser?: UseCatalogBrowserReturn;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

function ClassBrowserView({
  onSelect,
  forceMode = "full",
  semester,
  year,
  browser,
  expanded,
  onExpandedChange,
}: {
  onSelect: ClassBrowserProps["onSelect"];
  forceMode?: CatalogLayoutMode;
  semester: Semester;
  year: number;
  browser: UseCatalogBrowserReturn;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  return (
    <FilterContext value={browser.filters}>
      <ListContext value={browser.list}>
        <LayoutContext
          value={{
            mode: forceMode,
            expanded,
            setExpanded: onExpandedChange,
            query: browser.query,
            updateQuery: browser.updateQuery,
            hasActiveFilters: browser.hasActiveFilters,
            semester,
            year,
            aiSearchActive: browser.aiSearchActive,
            setAiSearchActive: browser.setAiSearchActive,
            handleSemanticSearch: browser.handleSemanticSearch,
            semanticLoading: browser.semanticLoading,
            semanticError: browser.semanticError,
            semanticSearchAvailable: browser.semanticSearchAvailable,
          }}
        >
          <div
            className={classNames(styles.root, {
              [styles.expanded]: expanded,
            })}
            data-mode={forceMode}
          >
            <Filters />
            <List onSelect={onSelect} />
          </div>
        </LayoutContext>
      </ListContext>
    </FilterContext>
  );
}

function ClassBrowserOwned({
  onSelect,
  forceMode = "full",
  semester,
  year,
  terms,
  persistent,
  expanded: controlledExpanded,
  onExpandedChange,
}: Omit<ClassBrowserProps, "browser">) {
  const browser = useCatalogBrowser({
    year,
    semester,
    terms,
    persistent,
  });
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
  const expanded = controlledExpanded ?? uncontrolledExpanded;
  const setExpanded = onExpandedChange ?? setUncontrolledExpanded;

  return (
    <ClassBrowserView
      onSelect={onSelect}
      forceMode={forceMode}
      semester={semester}
      year={year}
      browser={browser}
      expanded={expanded}
      onExpandedChange={setExpanded}
    />
  );
}

export default function ClassBrowser({
  browser,
  expanded,
  onExpandedChange,
  ...props
}: ClassBrowserProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);

  if (browser) {
    return (
      <ClassBrowserView
        onSelect={props.onSelect}
        forceMode={props.forceMode}
        semester={props.semester}
        year={props.year}
        browser={browser}
        expanded={expanded ?? uncontrolledExpanded}
        onExpandedChange={onExpandedChange ?? setUncontrolledExpanded}
      />
    );
  }

  return (
    <ClassBrowserOwned
      {...props}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    />
  );
}

export type { UseCatalogBrowserReturn };
