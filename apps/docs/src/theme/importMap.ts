/**
 * Maps component/hook names to their package import paths.
 * Derived from the imports in ReactLiveScope/index.tsx.
 *
 * Used for:
 * - Auto-generating imports when copying preview snippets to clipboard
 * - Generating proper imports when exporting jsx-live blocks to CodeSandbox
 *
 * File-based examples already have real imports, so this map is only needed
 * for legacy jsx-live blocks.
 */

type ImportEntry = {
  /** The package path, e.g. '@coinbase/cds-web/buttons' */
  source: string;
  /** Whether this is a default export */
  isDefault?: boolean;
};

export const importMap: Record<string, ImportEntry> = {
  // React
  useState: { source: 'react' },
  useEffect: { source: 'react' },
  useCallback: { source: 'react' },
  useMemo: { source: 'react' },
  useRef: { source: 'react' },
  useId: { source: 'react' },

  // CDS Common - Hooks
  useEventHandler: { source: '@coinbase/cds-common/hooks/useEventHandler' },
  useMergeRefs: { source: '@coinbase/cds-common/hooks/useMergeRefs' },
  usePreviousValue: { source: '@coinbase/cds-common/hooks/usePreviousValue' },
  useRefMap: { source: '@coinbase/cds-common/hooks/useRefMap' },
  useSort: { source: '@coinbase/cds-common/hooks/useSort' },

  // CDS Common - Data
  accounts: { source: '@coinbase/cds-common/internal/data/accounts' },
  assets: { source: '@coinbase/cds-common/internal/data/assets' },
  ethBackground: { source: '@coinbase/cds-common/internal/data/assets' },
  candles: { source: '@coinbase/cds-common/internal/data/candles' },
  loremIpsum: { source: '@coinbase/cds-common/internal/data/loremIpsum' },
  prices: { source: '@coinbase/cds-common/internal/data/prices' },
  product: { source: '@coinbase/cds-common/internal/data/product' },
  users: { source: '@coinbase/cds-common/internal/data/users' },

  // CDS Common - Visualization Data
  sparklineInteractiveData: { source: '@coinbase/cds-common/internal/visualizations/SparklineInteractiveData' },

  // CDS Common - Overlays
  OverlayContentContext: { source: '@coinbase/cds-common/overlays/OverlayContentContext' },
  useOverlayContentContext: { source: '@coinbase/cds-common/overlays/OverlayContentContext' },
  useAlert: { source: '@coinbase/cds-common/overlays/useAlert' },
  useModal: { source: '@coinbase/cds-common/overlays/useModal' },

  // CDS Common - Other
  useMultiSelect: { source: '@coinbase/cds-common/select/useMultiSelect' },
  useStepper: { source: '@coinbase/cds-common/stepper/useStepper' },
  LocaleProvider: { source: '@coinbase/cds-common/system/LocaleProvider' },
  useTabsContext: { source: '@coinbase/cds-common/tabs/TabsContext' },
  useTourContext: { source: '@coinbase/cds-common/tour/TourContext' },
  DateInputValidationError: { source: '@coinbase/cds-common/dates/DateInputValidationError' },

  // CDS Web - Layout
  Box: { source: '@coinbase/cds-web/layout' },
  HStack: { source: '@coinbase/cds-web/layout/HStack' },
  VStack: { source: '@coinbase/cds-web/layout/VStack' },
  Divider: { source: '@coinbase/cds-web/layout' },

  // CDS Web - Accordion
  Accordion: { source: '@coinbase/cds-web/accordion/Accordion' },
  AccordionItem: { source: '@coinbase/cds-web/accordion/AccordionItem' },

  // CDS Web - Alpha
  Combobox: { source: '@coinbase/cds-web/alpha/combobox/Combobox' },
  DataCard: { source: '@coinbase/cds-web/alpha/data-card' },
  Select: { source: '@coinbase/cds-web/alpha/select/Select' },
  SelectChip: { source: '@coinbase/cds-web/alpha/select-chip/SelectChip' },
  TabbedChips: { source: '@coinbase/cds-web/alpha/tabbed-chips/TabbedChips' },

  // CDS Web - Animation
  Lottie: { source: '@coinbase/cds-web/animation' },
  LottieStatusAnimation: { source: '@coinbase/cds-web/animation' },

  // CDS Web - Banner
  Banner: { source: '@coinbase/cds-web/banner/Banner' },

  // CDS Web - Buttons
  Button: { source: '@coinbase/cds-web/buttons' },
  IconButton: { source: '@coinbase/cds-web/buttons' },

  // CDS Web - Cards
  ContainedAssetCard: { source: '@coinbase/cds-web/cards' },
  FloatingAssetCard: { source: '@coinbase/cds-web/cards' },
  MediaCard: { source: '@coinbase/cds-web/cards' },
  MessagingCard: { source: '@coinbase/cds-web/cards' },
  NudgeCard: { source: '@coinbase/cds-web/cards' },
  UpsellCard: { source: '@coinbase/cds-web/cards' },

  // CDS Web - Carousel
  Carousel: { source: '@coinbase/cds-web/carousel' },
  CarouselItem: { source: '@coinbase/cds-web/carousel' },
  DefaultCarouselNavigation: { source: '@coinbase/cds-web/carousel' },
  DefaultCarouselPagination: { source: '@coinbase/cds-web/carousel' },

  // CDS Web - Chips
  Chip: { source: '@coinbase/cds-web/chips/Chip' },
  InputChip: { source: '@coinbase/cds-web/chips/InputChip' },
  MediaChip: { source: '@coinbase/cds-web/chips/MediaChip' },

  // CDS Web - Coachmark
  Coachmark: { source: '@coinbase/cds-web/coachmark/Coachmark' },

  // CDS Web - Collapsible
  Collapsible: { source: '@coinbase/cds-web/collapsible/Collapsible' },

  // CDS Web - Controls
  TextInput: { source: '@coinbase/cds-web/controls' },
  InputLabel: { source: '@coinbase/cds-web/controls/InputLabel' },

  // CDS Web - Dropdown
  Dropdown: { source: '@coinbase/cds-web/dropdown/Dropdown' },

  // CDS Web - Hooks
  useA11yControlledVisibility: { source: '@coinbase/cds-web/hooks/useA11yControlledVisibility' },
  useBreakpoints: { source: '@coinbase/cds-web/hooks/useBreakpoints' },
  useCheckboxGroupState: { source: '@coinbase/cds-web/hooks/useCheckboxGroupState' },
  useDimensions: { source: '@coinbase/cds-web/hooks/useDimensions' },
  useHasMounted: { source: '@coinbase/cds-web/hooks/useHasMounted' },
  useIsoEffect: { source: '@coinbase/cds-web/hooks/useIsoEffect' },
  useMediaQuery: { source: '@coinbase/cds-web/hooks/useMediaQuery' },
  useScrollBlocker: { source: '@coinbase/cds-web/hooks/useScrollBlocker' },
  useTheme: { source: '@coinbase/cds-web/hooks/useTheme' },

  // CDS Web - Icons
  Icon: { source: '@coinbase/cds-web/icons/Icon' },

  // CDS Web - Illustrations
  Pictogram: { source: '@coinbase/cds-web/illustrations/Pictogram' },
  SpotIcon: { source: '@coinbase/cds-web/illustrations' },
  SpotSquare: { source: '@coinbase/cds-web/illustrations' },
  SpotRectangle: { source: '@coinbase/cds-web/illustrations' },
  HeroSquare: { source: '@coinbase/cds-web/illustrations' },

  // CDS Web - Loaders
  Spinner: { source: '@coinbase/cds-web/loaders/Spinner' },

  // CDS Web - Media
  Avatar: { source: '@coinbase/cds-web/media' },
  RemoteImage: { source: '@coinbase/cds-web/media' },

  // CDS Web - Navigation
  Sidebar: { source: '@coinbase/cds-web/navigation' },
  SidebarItem: { source: '@coinbase/cds-web/navigation' },
  SidebarMoreMenu: { source: '@coinbase/cds-web/navigation' },
  NavigationBar: { source: '@coinbase/cds-web/navigation' },
  NavigationTitle: { source: '@coinbase/cds-web/navigation' },
  NavigationTitleSelect: { source: '@coinbase/cds-web/navigation' },

  // CDS Web - Overlays
  Modal: { source: '@coinbase/cds-web/overlays' },
  ModalHeader: { source: '@coinbase/cds-web/overlays' },
  ModalBody: { source: '@coinbase/cds-web/overlays' },
  ModalFooter: { source: '@coinbase/cds-web/overlays' },
  FullscreenModal: { source: '@coinbase/cds-web/overlays' },
  FullscreenAlert: { source: '@coinbase/cds-web/overlays' },
  Alert: { source: '@coinbase/cds-web/overlays' },
  Tray: { source: '@coinbase/cds-web/overlays' },
  Tooltip: { source: '@coinbase/cds-web/overlays' },
  Toast: { source: '@coinbase/cds-web/overlays' },
  FocusTrap: { source: '@coinbase/cds-web/overlays' },
  useToast: { source: '@coinbase/cds-web/overlays/useToast' },

  // CDS Web - Page
  PageHeader: { source: '@coinbase/cds-web/page/PageHeader' },
  PageFooter: { source: '@coinbase/cds-web/page/PageFooter' },

  // CDS Web - Pagination
  Pagination: { source: '@coinbase/cds-web/pagination/Pagination' },
  usePagination: { source: '@coinbase/cds-web/pagination/usePagination' },

  // CDS Web - Section Header
  SectionHeader: { source: '@coinbase/cds-web/section-header/SectionHeader' },
  MultiContentModule: { source: '@coinbase/cds-web/multi-content-module/MultiContentModule' },

  // CDS Web - Stepper
  Stepper: { source: '@coinbase/cds-web/stepper' },

  // CDS Web - System
  Pressable: { source: '@coinbase/cds-web/system' },
  Interactable: { source: '@coinbase/cds-web/system' },
  ThemeProvider: { source: '@coinbase/cds-web/system/ThemeProvider' },
  MediaQueryProvider: { source: '@coinbase/cds-web/system/MediaQueryProvider' },

  // CDS Web - Tables
  Table: { source: '@coinbase/cds-web/tables' },
  useSortableCell: { source: '@coinbase/cds-web/tables/hooks/useSortableCell' },

  // CDS Web - Tabs
  Tabs: { source: '@coinbase/cds-web/tabs' },
  TabNavigation: { source: '@coinbase/cds-web/tabs' },
  TabLabel: { source: '@coinbase/cds-web/tabs' },
  SegmentedTabs: { source: '@coinbase/cds-web/tabs' },

  // CDS Web - Tag
  Tag: { source: '@coinbase/cds-web/tag/Tag' },

  // CDS Web - Tour
  Tour: { source: '@coinbase/cds-web/tour/Tour' },
  TourStep: { source: '@coinbase/cds-web/tour/TourStep' },

  // CDS Web - Typography
  Text: { source: '@coinbase/cds-web/typography/Text' },
  Link: { source: '@coinbase/cds-web/typography' },

  // CDS Web - Controls (inputs)
  Checkbox: { source: '@coinbase/cds-web/controls' },
  CheckboxGroup: { source: '@coinbase/cds-web/controls' },
  Radio: { source: '@coinbase/cds-web/controls' },
  RadioGroup: { source: '@coinbase/cds-web/controls' },
  Switch: { source: '@coinbase/cds-web/controls' },

  // CDS Web - Numbers
  FormattedNumber: { source: '@coinbase/cds-web/numbers' },
  CurrencyText: { source: '@coinbase/cds-web/numbers' },
  PercentText: { source: '@coinbase/cds-web/numbers' },

  // CDS Web - Feedback
  ProgressBar: { source: '@coinbase/cds-web/visualizations' },
  ProgressCircle: { source: '@coinbase/cds-web/visualizations' },

  // CDS Web - Dots
  DotCount: { source: '@coinbase/cds-web/dots' },
  DotStatusColor: { source: '@coinbase/cds-web/dots' },
  DotSymbol: { source: '@coinbase/cds-web/dots' },

  // CDS Web - Dates
  DatePicker: { source: '@coinbase/cds-web/dates' },
  DateInput: { source: '@coinbase/cds-web/dates' },

  // Themes
  defaultTheme: { source: '@coinbase/cds-web/themes/defaultTheme' },

  // CDS Web Visualization - Chart
  CartesianChart: { source: '@coinbase/cds-web-visualization/chart' },
  ChartProvider: { source: '@coinbase/cds-web-visualization/chart' },
  LineChart: { source: '@coinbase/cds-web-visualization/chart' },
  AreaChart: { source: '@coinbase/cds-web-visualization/chart' },
  BarChart: { source: '@coinbase/cds-web-visualization/chart' },
  Line: { source: '@coinbase/cds-web-visualization/chart' },
  DottedLine: { source: '@coinbase/cds-web-visualization/chart' },
  SolidLine: { source: '@coinbase/cds-web-visualization/chart' },
  Area: { source: '@coinbase/cds-web-visualization/chart' },
  DottedArea: { source: '@coinbase/cds-web-visualization/chart' },
  GradientArea: { source: '@coinbase/cds-web-visualization/chart' },
  SolidArea: { source: '@coinbase/cds-web-visualization/chart' },
  Bar: { source: '@coinbase/cds-web-visualization/chart' },
  BarPlot: { source: '@coinbase/cds-web-visualization/chart' },
  BarStack: { source: '@coinbase/cds-web-visualization/chart' },
  BarStackGroup: { source: '@coinbase/cds-web-visualization/chart' },
  Scrubber: { source: '@coinbase/cds-web-visualization/chart' },
  DefaultScrubberBeacon: { source: '@coinbase/cds-web-visualization/chart' },
  DefaultScrubberBeaconLabel: { source: '@coinbase/cds-web-visualization/chart' },
  DefaultScrubberLabel: { source: '@coinbase/cds-web-visualization/chart' },
  XAxis: { source: '@coinbase/cds-web-visualization/chart' },
  YAxis: { source: '@coinbase/cds-web-visualization/chart' },
  Axis: { source: '@coinbase/cds-web-visualization/chart' },
  DefaultAxisTickLabel: { source: '@coinbase/cds-web-visualization/chart' },
  Legend: { source: '@coinbase/cds-web-visualization/chart' },
  DefaultLegendEntry: { source: '@coinbase/cds-web-visualization/chart' },
  DefaultLegendShape: { source: '@coinbase/cds-web-visualization/chart' },
  Point: { source: '@coinbase/cds-web-visualization/chart' },
  DefaultPointLabel: { source: '@coinbase/cds-web-visualization/chart' },
  ReferenceLine: { source: '@coinbase/cds-web-visualization/chart' },
  DefaultReferenceLineLabel: { source: '@coinbase/cds-web-visualization/chart' },
  Gradient: { source: '@coinbase/cds-web-visualization/chart' },
  PeriodSelector: { source: '@coinbase/cds-web-visualization/chart' },
  PeriodSelectorActiveIndicator: { source: '@coinbase/cds-web-visualization/chart' },
  LiveTabLabel: { source: '@coinbase/cds-web-visualization/chart' },
  ChartText: { source: '@coinbase/cds-web-visualization/chart' },
  ChartTextGroup: { source: '@coinbase/cds-web-visualization/chart' },
  Path: { source: '@coinbase/cds-web-visualization/chart' },

  // CDS Web Visualization - Sparkline
  Sparkline: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineArea: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineGradient: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractive: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractiveContent: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractiveHeader: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractivePeriodSelector: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractivePaths: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractiveTimeseriesPaths: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractiveHoverPrice: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractiveHoverDate: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractiveMarkerDates: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractiveLineVertical: { source: '@coinbase/cds-web-visualization/sparkline' },
  SparklineInteractiveAnimatedPath: { source: '@coinbase/cds-web-visualization/sparkline' },
};

/**
 * Given a code snippet, detect used identifiers and generate import statements.
 * Only generates imports for identifiers found in the importMap.
 */
export const generateImports = (code: string): string => {
  // Group imports by source package
  const importsBySource: Record<string, string[]> = {};

  for (const [name, entry] of Object.entries(importMap)) {
    // Simple heuristic: check if the identifier appears as a word boundary in the code
    const regex = new RegExp(`\\b${name}\\b`);
    if (regex.test(code)) {
      if (!importsBySource[entry.source]) {
        importsBySource[entry.source] = [];
      }
      importsBySource[entry.source].push(name);
    }
  }

  // Build import statements
  const imports: string[] = [];
  for (const [source, names] of Object.entries(importsBySource)) {
    const sortedNames = names.sort();
    if (sortedNames.length === 1) {
      imports.push(`import { ${sortedNames[0]} } from '${source}';`);
    } else {
      imports.push(`import { ${sortedNames.join(', ')} } from '${source}';`);
    }
  }

  return imports.sort().join('\n');
};
