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
 * Ported from the talv-pdf playground (playground/templates/classic.ts, commit 1dedd54, v0.4.0); the web
 * app owns this copy. Links use `formattedUrl`, without the protocol.
 *
 * Classic: serif throughout, a centred name over a contact line, uppercase headings with a rule
 * under them. No accent colour: everything is in the text colour. Board 1 on the design canvas.
 */

const heading = (value: string): LabelItem => ({
  text: value.toUpperCase(),
  fontSize: "md",
  font: "bold",
  color: "primary",
  padding: { y: "sm" },
  background: { border: { color: "primary", width: 0.75, sides: ["bottom"] } },
  margins: { top: "md", bottom: "md" },
});

/** "Technical:" before a joined list, in a narrow column of its own. */
const inline = (value: string): LabelItem => ({
  text: value,
  fontSize: "md",
  font: "bold",
  color: "primary",
  column: 90,
});

export const classic: Template = {
  family: "serif",
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
        gap: "sm",
        fields: [
          root(
            [
              text("name", { fontSize: "xl", font: "bold", justify: "center" }),
              row(
                ["email", "phone", "location", "primaryProfile"],
                {},
                { justify: "center", separator: " | " },
              ),
            ],
            { gap: "sm" },
          ),
        ],
      },
      section("summary", heading("Summary"), [root([text("description")])]),
      section("experience", heading("Experience"), [
        entries(
          "experience",
          [
            row(
              ["company", "locationType"],
              { company: { font: "bold" } },
              { justify: "between" },
            ),
            row(
              ["jobTitle", "dateRange"],
              { jobTitle: { font: "italic" } },
              { justify: "between" },
            ),
            description(),
          ],
          { headingItems: 2 },
        ),
      ]),
      section("education", heading("Education"), [
        entries(
          "education",
          [
            row(
              ["school", "dateRangeShort"],
              { school: { font: "bold" } },
              { justify: "between" },
            ),
            text("degree", { font: "italic" }),
            description(),
          ],
          { headingItems: 2 },
        ),
      ]),
      section(
        "skills",
        heading("Skills"),
        [
          joined("skills", {}, { label: inline("Technical:") }),
          joined("tools", {}, { label: inline("Tools:") }),
          joined("languages", {}, { label: inline("Languages:") }),
        ],
        { gap: "sm" },
      ),
      section("projects", heading("Projects"), [
        entries("projects", [
          row(
            ["projectName", "formattedUrl"],
            { projectName: { font: "bold" } },
            { gap: "md" },
          ),
          description({}, "sm"),
        ]),
      ]),
      section("recommendations", heading("Recommendations"), [
        entries("recommendations", [
          row(
            ["recommendeeName", "formattedUrl"],
            { recommendeeName: { font: "bold" } },
            { gap: "md" },
          ),
          description(),
        ]),
      ]),
    ]),
  ],
};
