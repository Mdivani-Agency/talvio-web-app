import type { Field, ItemStyle, LabelItem, Template } from "@pdf-tlv/resume";

import { description, entries, root, row, section, text } from "./shared";

/**
 * Sidebar (board 8): the main column on the left (name, role, profile, experience, projects) and a
 * side column in the accent on the right, full page height on every page, for contact details,
 * skills, tools, languages and education.
 *
 * The main column comes first in the config, so the PDF is written and read main column first. Side
 * text uses `onSecondary`, the engine's text-on-accent colour: white where it reaches 4.5:1 against
 * the accent, else the dark text colour. Sections reorder only within their own column.
 */

const mainHeading = (value: string): LabelItem => ({
  text: value.toUpperCase(),
  fontSize: "md",
  font: "bold",
  color: "secondary",
  margins: { top: "md", bottom: "sm" },
});

const sideHeading = (value: string): LabelItem => ({
  text: value.toUpperCase(),
  fontSize: "md",
  font: "bold",
  color: "onSecondary",
  padding: { y: "sm" },
  background: {
    border: { color: "onSecondary", width: 0.5, sides: ["bottom"] },
  },
  margins: { bottom: "sm" },
});

const onAccent = { fontSize: "sm" as const, color: "onSecondary" as const };
const muted = { fontSize: "sm" as const, color: "neutral" as const };

/** One value per line, such as each skill. */
const lines = (name: string): Field<ItemStyle> => ({
  name,
  source: "strings",
  gap: "sm",
  items: [text(name, onAccent)],
});

export const sidebar: Template = {
  defaultSectionOrder: [
    "summary",
    "experience",
    "skills",
    "education",
    "projects",
    "recommendations",
  ],
  // No page wrapper: the side column's box has to touch the page margin for `bleed` to reach the edge.
  groups: [
    {
      width: "full",
      direction: "horizontal",
      gap: "xl",
      groups: [
        // Main column: written first.
        {
          width: "2/3",
          gap: "md",
          padding: { x: "lg", y: "xl" },
          groups: [
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
                ]),
              ],
            },
            section("summary", mainHeading("Profile"), [
              root([text("description")]),
            ]),
            section("experience", mainHeading("Experience"), [
              entries("experience", [
                row(
                  ["jobTitle", "company"],
                  { jobTitle: { font: "semibold" } },
                  { separator: " · " },
                ),
                row(
                  ["dateRange", "locationType"],
                  { dateRange: muted, locationType: muted },
                  { separator: " · " },
                ),
                description(),
              ]),
            ]),
            section("projects", mainHeading("Projects"), [
              entries("projects", [
                row(
                  ["projectName", "formattedUrl"],
                  { projectName: { font: "semibold" }, formattedUrl: muted },
                  { separator: " · " },
                ),
                description(),
              ]),
            ]),
            section("recommendations", mainHeading("Recommendations"), [
              entries("recommendations", [
                row(
                  ["recommendeeName", "formattedUrl"],
                  {
                    recommendeeName: { font: "semibold" },
                    formattedUrl: muted,
                  },
                  { separator: " · " },
                ),
                description(),
              ]),
            ]),
          ],
        },
        // Side column: the accent from the top to the bottom of every page.
        {
          width: "1/3",
          gap: "lg",
          padding: { x: "lg", y: "xl" },
          background: { color: "secondary", fullHeight: true, bleed: true },
          groups: [
            {
              width: "full",
              label: sideHeading("Contact"),
              fields: [
                root(
                  [
                    text("email", { ...onAccent, wordBreaks: ["@", "."] }),
                    text("phone", onAccent),
                    text("location", onAccent),
                    text("primaryProfile", {
                      ...onAccent,
                      wordBreaks: ["/", "."],
                    }),
                  ],
                  { gap: "sm" },
                ),
              ],
            },
            section("skills", sideHeading("Skills"), [lines("skills")]),
            section("skills", sideHeading("Tools"), [lines("tools")]),
            section("skills", sideHeading("Languages"), [lines("languages")]),
            section("education", sideHeading("Education"), [
              entries("education", [
                text("degree", { ...onAccent, font: "semibold" }),
                text("school", onAccent),
                text("dateRangeShort", onAccent),
              ]),
            ]),
          ],
        },
      ],
    },
  ],
};
