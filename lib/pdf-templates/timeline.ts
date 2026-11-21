import type { Field, ItemStyle, LabelItem, Template } from "@pdf-tlv/resume";

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
 * Timeline (board 9): experience and education on a timeline, the dates in a left column in the
 * accent and a vertical rule with an accent marker per entry. Skills and languages in two columns
 * at the end. Headings in the text colour.
 */

const heading = (value: string): LabelItem => ({
  text: value.toUpperCase(),
  fontSize: "md",
  font: "bold",
  color: "primary",
  margins: { top: "md", bottom: "sm" },
});

const muted = { fontSize: "sm" as const, color: "neutral" as const };
const DATE_COLUMN = 88;

const onTimeline = (
  name: string,
  items: ItemStyle[],
  dates: string,
): Field<ItemStyle> =>
  entries(
    name,
    [
      text(dates, { fontSize: "sm", font: "semibold", color: "secondary" }),
      ...items,
    ],
    {
      gap: "md",
      aside: {
        name: dates,
        width: DATE_COLUMN,
        gap: "lg",
        rule: { color: "neutral", marker: "secondary" },
      },
    },
  );

export const timeline: Template = {
  defaultSectionOrder: [
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
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
              { font: "semibold", color: "secondary" },
              { top: "sm" },
            ),
            row(
              ["email", "phone", "location", "primaryProfile"],
              {
                email: muted,
                phone: muted,
                location: muted,
                primaryProfile: muted,
              },
              { separator: " · ", margins: { top: "sm" } },
            ),
          ]),
        ],
      },
      section("summary", heading("Summary"), [root([text("description")])]),
      section("experience", heading("Experience"), [
        onTimeline(
          "experience",
          [
            text("jobTitle", { font: "semibold" }),
            row(
              ["company", "locationType"],
              { company: muted, locationType: muted },
              { separator: " · " },
            ),
            description(),
          ],
          "dateRange",
        ),
      ]),
      section("education", heading("Education"), [
        onTimeline(
          "education",
          [
            text("degree", { font: "semibold" }),
            text("school", muted),
            description(),
          ],
          "dateRangeShort",
        ),
      ]),
      {
        width: "full",
        direction: "horizontal",
        gap: "lg",
        groups: [
          section(
            "skills",
            heading("Skills"),
            [joined("skills"), joined("tools")],
            { width: "1/2", gap: "sm" },
          ),
          section("skills", heading("Languages"), [joined("languages")], {
            width: "1/2",
          }),
        ],
      },
      section("projects", heading("Projects"), [
        entries("projects", [
          row(
            ["projectName", "formattedUrl"],
            { projectName: { font: "semibold" }, formattedUrl: muted },
            { justify: "split" },
          ),
          description(),
        ]),
      ]),
      section("recommendations", heading("Recommendations"), [
        entries("recommendations", [
          row(
            ["recommendeeName", "formattedUrl"],
            { recommendeeName: { font: "semibold" }, formattedUrl: muted },
            { justify: "split" },
          ),
          description(),
        ]),
      ]),
    ]),
  ],
};
