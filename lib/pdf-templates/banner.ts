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
 * Banner (board 10): a full-width band in the accent with the name, role and a wrapping contact
 * row, then one column. Skills and tools as rounded chips.
 *
 * Band text uses `onSecondary`: white where it reaches 4.5:1 against the accent, else the dark text
 * colour, so a light accent stays readable.
 */

const heading = (value: string): LabelItem => ({
  text: value,
  fontSize: "lg",
  font: "bold",
  color: "secondary",
  margins: { top: "md", bottom: "sm" },
});

const onAccent = { color: "onSecondary" as const };

/** A top-level list (`skills`, `tools`) as rounded chips. */
const chips = (name: string): Field<ItemStyle> => ({
  name,
  source: "root",
  join: {
    type: "join",
    output: "row",
    width: 0,
    gap: "sm",
    chip: {
      background: { color: "secondaryTint", radius: 9 },
      padding: { x: "md", y: "sm" },
    },
    item: { fontSize: "sm", font: "regular", color: "primary" },
  },
  items: [],
});
const muted = { color: "neutral" as const };

export const banner: Template = {
  // Languages is its own section so it stays after Education, as on the board; it is not movable, so
  // with a custom order it follows the movable sections.
  defaultSectionOrder: [
    "summary",
    "experience",
    "skills",
    "education",
    "languages",
    "projects",
    "recommendations",
  ],
  groups: [
    // The band is outside the page wrapper, so `bleed` takes it to the top, left and right edges.
    {
      width: "full",
      padding: { x: "xl", y: "xl" },
      background: { color: "secondary", bleed: true },
      fields: [
        root([
          text("name", { fontSize: "xl", font: "bold", ...onAccent }),
          text("role", { fontSize: "lg", ...onAccent }, { top: "sm" }),
          row(
            ["email", "phone", "location", "primaryProfile"],
            {
              email: { fontSize: "sm", ...onAccent },
              phone: { fontSize: "sm", ...onAccent },
              location: { fontSize: "sm", ...onAccent },
              primaryProfile: { fontSize: "sm", ...onAccent },
            },
            { gap: "lg", margins: { top: "md" } },
          ),
        ]),
      ],
    },
    page([
      section("summary", heading("About"), [root([text("description")])]),
      section("experience", heading("Experience"), [
        entries("experience", [
          row(
            ["jobTitle", "company", "dateRange"],
            { jobTitle: { font: "semibold" }, dateRange: muted },
            { justify: "split", separator: " · " },
          ),
          description(),
        ]),
      ]),
      // Skills, then tools, as one run of chips: the board mixes both.
      section("skills", heading("Skills"), [chips("skills"), chips("tools")], {
        gap: "sm",
      }),
      section("education", heading("Education"), [
        entries("education", [
          row(
            ["degree", "school", "dateRangeShort"],
            { degree: { font: "semibold" }, dateRangeShort: muted },
            { justify: "split", separator: " · " },
          ),
          description(),
        ]),
      ]),
      section("languages", heading("Languages"), [joined("languages")]),
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
