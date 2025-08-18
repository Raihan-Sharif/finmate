import React from 'react'
import {
  // Basic Icons
  Folder,
  Home,
  Car,
  CreditCard,
  Briefcase,
  GraduationCap,
  ShoppingCart,
  Coffee,
  Gamepad2,
  Heart,
  Music,
  Camera,
  Book,
  Plane,
  MapPin,
  Phone,
  Mail,
  Users,
  UserCheck,
  Building,
  Factory,
  Truck,
  Bus,
  Train,
  Fuel,
  Zap,
  Droplets,
  Wifi,
  Smartphone,
  Laptop,
  Tv,
  Headphones,
  Watch,
  ShoppingBag,
  Shirt,
  Package,
  Gift,
  Star,
  Award,
  Target,
  Layers,
  Grid,
  Circle,
  Square,
  Triangle,
  Diamond,
  Hash,
  DollarSign,
  PiggyBank,
  CreditCard as Card,
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calculator,
  Calendar,
  Clock,
  Timer,
  Bell,
  BellRing,
  Settings,
  Wrench,
  Hammer,
  Paintbrush,
  Palette,
  Image,
  FileText,
  File,
  Database,
  HardDrive,
  CloudUpload,
  CloudDownload,
  Download,
  Upload,
  Link,
  ExternalLink,
  Search,
  Filter,
  MoreHorizontal,
  MoreVertical,
  Menu,
  X,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  Share,
  Send,
  Save,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  RefreshCw,
  Power,
  Lock,
  Unlock,
  Shield,
  Key,
  User,
  UserPlus,
  UserMinus,
  UserX,
  Crown,
  Flag,
  Bookmark,
  Tag,
  Tags,
} from 'lucide-react'

// Icon mapping object
const iconMap: { [key: string]: React.ComponentType<any> } = {
  // Default
  'folder': Folder,
  
  // Home & Living
  'home': Home,
  'building': Building,
  'factory': Factory,
  
  // Transportation
  'car': Car,
  'truck': Truck,
  'bus': Bus,
  'train': Train,
  'plane': Plane,
  'fuel': Fuel,
  
  // Finance
  'credit-card': CreditCard,
  'card': Card,
  'wallet': Wallet,
  'banknote': Banknote,
  'dollar-sign': DollarSign,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'bar-chart-3': BarChart3,
  'pie-chart': PieChart,
  'activity': Activity,
  'calculator': Calculator,
  
  // Work & Education
  'briefcase': Briefcase,
  'graduation-cap': GraduationCap,
  'book': Book,
  'file-text': FileText,
  'file': File,
  
  // Shopping & Food
  'shopping-cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  'coffee': Coffee,
  'package': Package,
  'gift': Gift,
  'shirt': Shirt,
  
  // Entertainment & Hobbies
  'gamepad-2': Gamepad2,
  'music': Music,
  'camera': Camera,
  'tv': Tv,
  'headphones': Headphones,
  
  // Health & Wellness
  'heart': Heart,
  
  // Technology
  'smartphone': Smartphone,
  'laptop': Laptop,
  'watch': Watch,
  'wifi': Wifi,
  'database': Database,
  'hard-drive': HardDrive,
  
  // Utilities
  'zap': Zap,
  'droplets': Droplets,
  'phone': Phone,
  'mail': Mail,
  
  // Time & Calendar
  'calendar': Calendar,
  'clock': Clock,
  'timer': Timer,
  
  // Communication & Social
  'users': Users,
  'user': User,
  'user-check': UserCheck,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  'user-x': UserX,
  
  // Locations
  'map-pin': MapPin,
  
  // Actions
  'search': Search,
  'filter': Filter,
  'edit': Edit,
  'trash-2': Trash2,
  'copy': Copy,
  'share': Share,
  'send': Send,
  'save': Save,
  'download': Download,
  'upload': Upload,
  
  // Navigation
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  
  // Status & Alerts
  'check': Check,
  'x': X,
  'plus': Plus,
  'minus': Minus,
  'alert-triangle': AlertTriangle,
  'alert-circle': AlertCircle,
  'info': Info,
  'help-circle': HelpCircle,
  'bell': Bell,
  'bell-ring': BellRing,
  
  // Shapes & Symbols
  'circle': Circle,
  'square': Square,
  'triangle': Triangle,
  'diamond': Diamond,
  'star': Star,
  'award': Award,
  'target': Target,
  'flag': Flag,
  'crown': Crown,
  'bookmark': Bookmark,
  'tag': Tag,
  'tags': Tags,
  
  // Interface
  'menu': Menu,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  'eye': Eye,
  'eye-off': EyeOff,
  'settings': Settings,
  'wrench': Wrench,
  'hammer': Hammer,
  'paintbrush': Paintbrush,
  'palette': Palette,
  'image': Image,
  'layers': Layers,
  'grid': Grid,
  'hash': Hash,
  
  // Security
  'lock': Lock,
  'unlock': Unlock,
  'shield': Shield,
  'key': Key,
  
  // System
  'power': Power,
  'refresh-cw': RefreshCw,
  'rotate-ccw': RotateCcw,
  'cloud-upload': CloudUpload,
  'cloud-download': CloudDownload,
  'link': Link,
  'external-link': ExternalLink,
}

// Function to get icon component from icon name
export const getIconComponent = (iconName: string | undefined): React.ComponentType<any> => {
  if (!iconName) return Folder
  
  // Clean the icon name (remove any extra characters)
  const cleanName = iconName.toLowerCase().trim()
  
  // Return the icon component or default to Folder
  return iconMap[cleanName] || Folder
}

// Function to render icon with props
export const renderIcon = (iconName: string | undefined, props: any = {}) => {
  const IconComponent = getIconComponent(iconName)
  return <IconComponent {...props} />
}

// Function to get all available icon names
export const getAvailableIcons = (): string[] => {
  return Object.keys(iconMap)
}

export default iconMap