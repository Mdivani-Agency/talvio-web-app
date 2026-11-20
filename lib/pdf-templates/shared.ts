import type {
  Field,
  Group,
  ItemStyle,
  LabelItem,
  LineParamStyles,
  Padding,
  RowItem,
  RowJustify,
  RowParamStyles,
  Size,
  TextItem,
} from '@pdf-tlv/resume';

/**
 * Building blocks shared by the app's own templates (not part of @pdf-tlv/resume). Ported from the
 * talv-pdf playground (playground/templates/shared.ts, commit 1dedd54, v0.4.0).
 */

export const style = (overrides: Partial<LineParamStyles> = {}): LineParamStyles => ({
  fontSize: 'md',
  color: 'primary',
  font: 'regular',
  ...overrides,
});

/** One value of the data. */
export const text = (
  name: string,
  overrides: Partial<LineParamStyles> = {},
  margins?: TextItem<LineParamStyles>['margins'],
): TextItem<LineParamStyles> => ({ type: 'text', name, margins, item: style(overrides) });

/** Several values on one line, each with its own style. */
export const row = (
  keys: string[],
  styles: Record<string, Partial<LineParamStyles>> = {},
  {
    justify = 'start',
    separator,
    gap,
    margins,
  }: {
    justify?: RowJustify;
    separator?: string;
    gap?: Size;
    margins?: RowItem<RowParamStyles>['margins'];
  } = {},
): RowItem<RowParamStyles> => ({
  type: 'row',
  keys,
  margins,
  item: {
    justify,
    containerWidth: 0,
    separator,
    gap,
    texts: Object.fromEntries(keys.map((key) => [key, style(styles[key])])),
  },
});

/** A rich-text description. */
export const description = (
  overrides: Partial<Pick<LineParamStyles, 'fontSize' | 'color' | 'family'>> = {},
  top: Size = 'sm',
): ItemStyle => ({
  type: 'content',
  name: 'description',
  margins: { top },
  ...(Object.keys(overrides).length ? { item: overrides } : {}),
});

/** A list from the top level of the data (`skills`, `tools`, `languages`) joined into one line. */
export const joined = (
  name: string,
  overrides: Partial<LineParamStyles> = {},
  { label, separator = ', ' }: { label?: LabelItem; separator?: string } = {},
): Field<ItemStyle> => ({
  name,
  source: 'root',
  label,
  join: { type: 'join', output: 'text', separator, width: 0, item: style(overrides) },
  items: [],
});

/** One entry per object of a list, such as `experience`. */
export const entries = (
  name: string,
  items: ItemStyle[],
  extra: Partial<Field<ItemStyle>> = {},
): Field<ItemStyle> => ({ name, source: 'objects', gap: 'sm', items, ...extra });

/** Top-level values, such as the name and role. */
export const root = (
  items: ItemStyle[],
  extra: Partial<Field<ItemStyle>> = {},
): Field<ItemStyle> => ({
  name: 'root',
  source: 'root',
  items,
  ...extra,
});

/** A section that can be reordered, with its heading. */
export const section = (
  name: string,
  label: LabelItem | undefined,
  fields: Field<ItemStyle>[],
  extra: Partial<Group<ItemStyle>> = {},
): Group<ItemStyle> => ({ width: 'full', section: name, gap: 'md', label, fields, ...extra });

/**
 * Wraps the template's groups to give the page wider side margins than the engine's 20 points. The
 * padding grows with the font size scale, like the rest of the layout.
 */
export const page = (
  groups: Group<ItemStyle>[],
  padding: Padding = { x: 'xl' },
): Group<ItemStyle> => ({
  width: 'full',
  padding,
  groups,
});
