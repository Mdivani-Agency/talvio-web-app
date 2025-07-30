import Add from './svg/add.svg';
import Menu from './svg/menu.svg';
import Corportate from './svg/corporate-alt.svg';
import Cloud from './svg/cloud-download-alt.svg';
import Pencil from './svg/blog-pencil.svg';
import MemoCheck from './svg/memo-circle-check.svg';
import Done from './svg/done.svg';
import Calendar from './svg/calendar.svg';
import ChevronDown from './svg/chevron-down.svg';
import ErrorOutline from './svg/error-outline.svg';
import Edit from './svg/edit.svg';
import Vector from './svg/vector.svg';
import Delete from './svg/delete.svg';
import BoldB from './svg/bold-b.svg';
import ItalicI from './svg/italic-i.svg';
import BulletList from './svg/bullet-list.svg';
import Download from './svg/download.svg';
import Switch from './svg/switch.svg';
import View from './svg/view.svg';
import ChevronLeft from './svg/chevron-left.svg';
import ChevronRight from './svg/chevron-right.svg';
import Spinner from './svg/spinner.svg';
import Close from './svg/close.svg';
import Contact from './svg/cv.svg';
import Graduate from './svg/graduate.svg';
import SuitCase from './svg/suit-case.svg';
import Text from './svg/text.svg';
import User from './svg/user.svg';
import Mail from './svg/mail.svg';
import Phone from './svg/phone.svg';
import Link from './svg/link.svg';
import Drag from './svg/drag.svg';
import Star from './svg/star.svg';
import Project from './svg/project.svg';
import Twitter from './svg/twitter.svg';
import LinkedIn from './svg/linkedin.svg';
import DarkMode from './svg/dark-mode.svg';
import Settings from './svg/settings.svg';
import Logout from './svg/logout.svg';
import Paint from './svg/paint.svg';
import Zoom from './svg/zoom.svg';
import Upload from './svg/upload.svg';
import FontSize from './svg/font-size.svg';
import Document from './svg/document.svg';
import TrashBin from './svg/trash-bin.svg';
import Premium from './svg/premium.svg';
import Pin from './svg/pin.svg';
import Email from './svg/email.svg';
import Share from './svg/share.svg';
import Web from './svg/web.svg';
import Spark from './svg/spark.svg';

import Google from './colored/google.svg';
import Logo from './colored/logo.svg';
import VerifyEmail from './colored/verify-email.svg';
import Rocket from './colored/rocket.svg';

import { cn } from '@utils/tailwind';

const IconMap = {
  Add,
  Menu,
  Corportate,
  Cloud,
  Pencil,
  MemoCheck,
  Done,
  Calendar,
  ChevronDown,
  ErrorOutline,
  Edit,
  Vector,
  Delete,
  BoldB,
  ItalicI,
  BulletList,
  Download,
  Switch,
  View,
  ChevronLeft,
  ChevronRight,
  Spinner,
  Close,
  Contact,
  Graduate,
  SuitCase,
  Text,
  User,
  Mail,
  Phone,
  Link,
  Drag,
  Star,
  Project,
  Google,
  Twitter,
  LinkedIn,
  Logo,
  DarkMode,
  Settings,
  Logout,
  VerifyEmail,
  Paint,
  Zoom,
  Upload,
  FontSize,
  Document,
  Rocket,
  TrashBin,
  Premium,
  Pin,
  Email,
  Share,
  Web,
  Spark,
};

export type IconType = keyof typeof IconMap;

export type IconProp = {
  type: IconType;
  className?: string;
  width?: number;
  height?: number;
  onClick?: () => void;
};

export const Icon = ({ onClick, className, type = 'Add', ...props }: IconProp) => {
  const IconSVG = IconMap[type];
  if (!IconSVG) {
    throw new Error('Select Correct Icon Type');
  }

  return <IconSVG onClick={onClick} className={cn('inline-block', className)} {...props} />;
};
