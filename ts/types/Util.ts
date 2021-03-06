export type RenderTextCallback = (
  options: {
    text: string;
    key: number;
  }
) => JSX.Element | string;

export type Localizer = (key: string, values?: Array<string>) => string;

export type Color =
  | 'gray'
  | 'blue'
  | 'cyan'
  | 'deep_orange'
  | 'green'
  | 'indigo'
  | 'pink'
  | 'purple'
  | 'red'
  | 'teal';

export enum Colors {
  OFFLINE = '#3d3e44',
  OFFLINE_LIGHT = '#cccece',
  ONLINE = '#1c8260',
}
