import { PDFDocument, PDFPage, type RGB } from "pdf-lib";
import { afterEach, describe, expect, it } from "vitest";
import type { Group, ItemStyle, Template } from "@pdf-tlv/resume";

import { generateResumePdfBytes } from "@/lib/services/resume-pdf.server";
import { RESUME_COLORS_MAP } from "@lib/utils";
import type { ResumeForm } from "@lib/types";

import {
  templateSample,
  templateSampleLong,
  templateSampleWithoutOptionalFields,
} from "../../test/fixtures/template-samples";

import {
  banner,
  classic,
  compact,
  executive,
  graduate,
  minimal,
  sidebar,
  skillsFirst,
  technical,
  timeline,
} from "./index";

const TEMPLATES = { classic, compact, minimal, executive, skillsFirst, graduate, technical, sidebar, timeline, banner } as const;

type Drawn = { text: string; page: PDFPage; color?: RGB };

const drawText = PDFPage.prototype.drawText;

/** Every string the renderer draws, in drawing order (which is the PDF's reading order). */
async function render(
  resume: ResumeForm,
  template: Template,
  color = "#005BA2",
  fontSize: "sm" | "md" | "lg" = "md",
) {
  const drawn: Drawn[] = [];
  PDFPage.prototype.drawText = function (text, options) {
    drawn.push({ text, page: this, color: options?.color as RGB | undefined });
    return drawText.call(this, text, options);
  };
  const bytes = await generateResumePdfBytes(resume, template, {
    color,
    fontSize,
  });
  const pages = (await PDFDocument.load(bytes)).getPageCount();
  return { drawn, texts: drawn.map((item) => item.text.trim()), pages };
}

/** Section headings by section name, in config order. */
function headings(template: Template) {
  const found: Array<{ section: string; text: string }> = [];
  const walk = (groups: Group<ItemStyle>[]) =>
    groups.forEach((group) => {
      if (group.section && group.label?.text)
        found.push({ section: group.section, text: group.label.text });
      walk(group.groups ?? []);
    });
  walk(template.groups);
  return found;
}

const channel = (value: number) =>
  value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const luminance = ({
  red,
  green,
  blue,
}: {
  red: number;
  green: number;
  blue: number;
}) => 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
const contrast = (
  a: { red: number; green: number; blue: number },
  b: { red: number; green: number; blue: number },
) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
};
const hex = (value: string) => ({
  red: parseInt(value.slice(1, 3), 16) / 255,
  green: parseInt(value.slice(3, 5), 16) / 255,
  blue: parseInt(value.slice(5, 7), 16) / 255,
});

afterEach(() => {
  PDFPage.prototype.drawText = drawText;
});

describe.each(Object.entries(TEMPLATES))("%s", (_name, template) => {
  const sections = headings(template);

  it("names every movable section it draws in its default order", () => {
    const named = new Set(sections.map((section) => section.section));
    for (const name of named)
      expect(template.defaultSectionOrder).toContain(name);
  });

  it("draws the sample on one page, with the headings in the default order", async () => {
    const { texts, pages } = await render(templateSample, template);
    expect(pages).toBe(1);
    const order = template.defaultSectionOrder ?? [];
    const drawn = sections
      .map((section) => ({ ...section, at: texts.indexOf(section.text) }))
      .filter((section) => section.at >= 0)
      .sort((a, b) => a.at - b.at)
      .map((section) => order.indexOf(section.section));
    expect(drawn.length).toBeGreaterThan(3);
    // Two-column templates read one column after the other, so compare within the main flow only.
    if (template !== sidebar)
      expect(drawn).toEqual([...drawn].sort((a, b) => a - b));
  });

  it("prints every skill, tool and language of the resume", async () => {
    const { texts } = await render(templateSample, template);
    const all = texts.join(" ");
    for (const value of [
      "TypeScript",
      "Mentoring",
      "Terraform",
      "Datadog",
      "English",
      "Swedish",
    ]) {
      expect(all).toContain(value);
    }
  });

  it("renders without the optional fields", async () => {
    const { texts, pages } = await render(
      templateSampleWithoutOptionalFields,
      template,
    );
    expect(pages).toBe(1);
    expect(texts).not.toContain("Selected achievements");
    expect(texts).not.toContain("Languages and frameworks");
    expect(texts.some((text) => text.includes("TypeScript"))).toBe(true);
  });

  it.each(["sm", "lg"] as const)(
    "renders the sample at text size %s",
    async (size) => {
      const { texts, pages } = await render(
        templateSample,
        template,
        "#005BA2",
        size,
      );
      expect(pages).toBeLessThanOrEqual(2);
      expect(texts).toContain("Maya Lindqvist");
    },
  );

  it("runs a long career onto a second page", async () => {
    const { pages, texts } = await render(templateSampleLong, template);
    expect(pages).toBeGreaterThanOrEqual(2);
    expect(texts.some((text) => text.includes("Company 12"))).toBe(true);
  });

  it("shows only the sections that have data", async () => {
    const { texts } = await render(
      {
        profile: { firstName: "Maya", lastName: "Lindqvist", role: "Engineer" },
        contacts: { email: "maya@lindqvist.dev" },
        experience: templateSample.experience?.slice(0, 1),
      },
      template,
    );
    const shown = sections
      .filter((section) => texts.includes(section.text))
      .map((section) => section.section);
    expect([...new Set(shown)]).toEqual(["experience"]);
  });

  it("moves a section when the resume has its own order", async () => {
    const { texts } = await render(
      { ...templateSample, sectionOrder: ["projects", "experience"] },
      template,
    );
    const projects = sections.find(
      (section) => section.section === "projects",
    )!.text;
    const experience = sections.find(
      (section) => section.section === "experience",
    )!.text;
    expect(texts.indexOf(projects)).toBeLessThan(texts.indexOf(experience));
  });
});

describe("optional fields", () => {
  it("Executive leads with up to three headline achievements, and leaves the section out without them", async () => {
    const { texts } = await render(
      templateSample,
      executive,
      RESUME_COLORS_MAP.ember,
    );
    const at = texts.indexOf("Selected achievements");
    expect(at).toBeGreaterThan(texts.indexOf("Executive summary"));
    expect(at).toBeLessThan(texts.indexOf("Experience"));
    expect(texts).toEqual(
      expect.arrayContaining(["1.2 million", "patients on the platform", "14"]),
    );
  });

  it("Technical draws a skills table by group, or one Skills row without groups, and each role's stack", async () => {
    const grouped = await render(templateSample, technical);
    expect(grouped.texts).toEqual(
      expect.arrayContaining([
        "Languages and",
        "Data",
        "Architecture",
        "Other",
      ]),
    );
    expect(grouped.texts).toEqual(expect.arrayContaining(["Kafka", "Node.js"]));

    const plain = await render(templateSampleWithoutOptionalFields, technical);
    expect(plain.texts).toContain("Skills");
    expect(plain.texts).not.toContain("Architecture");
    expect(plain.texts).not.toContain("Node.js");
  });
});

describe("Sidebar", () => {
  it("writes the main column before the side column, so extracted text reads in order", async () => {
    const { texts } = await render(templateSample, sidebar);
    const lastMain = texts.indexOf(
      "Maya made our platform something the whole company relies on.",
    );
    expect(lastMain).toBeGreaterThan(-1);
    expect(lastMain).toBeLessThan(texts.indexOf("CONTACT"));
    expect(texts.indexOf("CONTACT")).toBeLessThan(texts.indexOf("EDUCATION"));
  });

  it("keeps side sections in the side column whatever the order", async () => {
    const { texts } = await render(
      { ...templateSample, sectionOrder: ["education", "skills"] },
      sidebar,
    );
    expect(texts.indexOf("EDUCATION")).toBeLessThan(texts.indexOf("SKILLS"));
    expect(texts.indexOf("EDUCATION")).toBeGreaterThan(
      texts.indexOf("PROFILE"),
    );
  });
});

describe("text on the accent", () => {
  it.each(Object.entries(RESUME_COLORS_MAP))(
    "reaches 4.5:1 on %s in Sidebar and Banner",
    async (_name, accent) => {
      for (const [template, label] of [
        [sidebar, "CONTACT"],
        [banner, "Maya Lindqvist"],
      ] as const) {
        const { drawn } = await render(templateSample, template, accent);
        const item = drawn.find((entry) => entry.text.trim() === label);
        expect(item?.color).toBeDefined();
        expect(contrast(item!.color!, hex(accent))).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
