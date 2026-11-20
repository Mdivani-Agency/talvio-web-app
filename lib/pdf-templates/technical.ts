import type { LabelItem, Template } from "@pdf-tlv/resume";

import {
  description,
  entries,
  joined,
  page,
  root,
  row,
  section,
  text,
} from "./shared";

/**
 * Technical (board 7): Inter, with IBM Plex Mono for the role, the contact line, dates, links and
 * the "# " section headings. Skills as a table of group and skills (one "Skills" row without
 * groups), and each role's stack as outlined chips under it.
 */

const heading = (value: string): LabelItem => ({
  text: `# ${value}`,
  fontSize: "md",
  font: "semibold",
  family: "mono",
  color: "secondary",
  margins: { top: "md", bottom: "sm" },
});

const mono = {
  family: "mono" as const,
  fontSize: "sm" as const,
  color: "neutral" as const,
};
const TABLE_COLUMN = 90;
const tableRow = {
  padding: { y: "sm" as const },
  background: {
    border: { color: "neutral" as const, sides: ["bottom" as const] },
  },
};

export const technical: Template = {
  defaultSectionOrder: [
    "summary",
    "skills",
    "experience",
    "projects",
    "education",
    "recommendations",
  ],
  groups: [
    page([
      {
        width: "full",
        fields: [
          root([
            text("name", { fontSize: "xl", font: "bold" }),
            text(
              "role",
              { font: "semibold", family: "mono", color: "secondary" },
              { top: "sm" },
            ),
            row(
              ["email", "phone", "primaryProfile", "location"],
              {
                email: mono,
                phone: mono,
                primaryProfile: mono,
                location: mono,
              },
              { separator: " · ", margins: { top: "sm" } },
            ),
          ]),
        ],
      },
      section("summary", heading("Summary"), [root([text("description")])]),
      section(
        "skills",
        heading("Skills"),
        [
          entries(
            "skillGroups",
            [
              text("name", { font: "semibold", fontSize: "sm" }),
              {
                type: "list",
                name: "skills",
                output: "text",
                item: { fontSize: "sm", font: "regular", color: "primary" },
              },
            ],
            {
              gap: undefined,
              aside: { name: "name", width: TABLE_COLUMN },
              ...tableRow,
            },
          ),
        ],
        { when: "skillGroups" },
      ),
      // Without groups, one "Skills" row of the same table.
      section(
        "skills",
        heading("Skills"),
        [
          {
            ...joined(
              "skills",
              { fontSize: "sm" },
              {
                label: {
                  text: "Skills",
                  fontSize: "sm",
                  font: "semibold",
                  color: "primary",
                  column: TABLE_COLUMN,
                },
              },
            ),
          },
        ],
        { unless: "skillGroups" },
      ),
      section(
        "skills",
        undefined,
        [
          joined(
            "tools",
            { fontSize: "sm" },
            {
              label: {
                text: "Tools",
                fontSize: "sm",
                font: "semibold",
                color: "primary",
                column: TABLE_COLUMN,
              },
            },
          ),
          joined(
            "languages",
            { fontSize: "sm" },
            {
              label: {
                text: "Languages",
                fontSize: "sm",
                font: "semibold",
                color: "primary",
                column: TABLE_COLUMN,
              },
            },
          ),
        ],
        { gap: "sm" },
      ),
      section("experience", heading("Experience"), [
        entries("experience", [
          row(
            ["jobTitle", "company", "dateRange"],
            { jobTitle: { font: "semibold" }, dateRange: mono },
            { justify: "split", separator: " · " },
          ),
          description(),
          {
            type: "list",
            name: "stack",
            output: "row",
            gap: "sm",
            margins: { top: "sm" },
            chip: {
              background: { border: { color: "neutral" }, radius: 2.25 },
              padding: { x: "sm", y: "sm" },
            },
            item: {
              fontSize: "sm",
              font: "regular",
              family: "mono",
              color: "primary",
            },
          },
        ]),
      ]),
      section("projects", heading("Projects"), [
        entries("projects", [
          row(
            ["projectName", "formattedUrl"],
            { projectName: { font: "semibold" }, formattedUrl: mono },
            { justify: "split" },
          ),
          description(),
        ]),
      ]),
      section("education", heading("Education"), [
        entries("education", [
          row(
            ["degree", "school", "dateRangeShort"],
            { degree: { font: "semibold" }, dateRangeShort: mono },
            { justify: "split", separator: " · " },
          ),
          description(),
        ]),
      ]),
      section("recommendations", heading("Recommendations"), [
        entries("recommendations", [
          row(
            ["recommendeeName", "formattedUrl"],
            { recommendeeName: { font: "semibold" }, formattedUrl: mono },
            { justify: "split" },
          ),
          description(),
        ]),
      ]),
    ]),
  ],
};
