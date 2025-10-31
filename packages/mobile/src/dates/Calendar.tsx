import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type StyleProp, StyleSheet, type View, type ViewStyle } from 'react-native';
import { generateCalendarMonth } from '@coinbase/cds-common/dates/generateCalendarMonth';
import { getMidnightDate } from '@coinbase/cds-common/dates/getMidnightDate';
import { getTimesFromDatesAndRanges } from '@coinbase/cds-common/dates/getTimesFromDatesAndRanges';
import { useLocale } from '@coinbase/cds-common/system/LocaleProvider';
import { accessibleOpacityDisabled } from '@coinbase/cds-common/tokens/interactable';

import { useA11y } from '../hooks/useA11y';
import { Icon } from '../icons/Icon';
import { Box } from '../layout/Box';
import { HStack } from '../layout/HStack';
import { VStack, type VStackProps } from '../layout/VStack';
import { Tooltip } from '../overlays/tooltip/Tooltip';
import { Pressable, type PressableBaseProps } from '../system/Pressable';
import { Text } from '../typography/Text';

const CALENDAR_DAY_SIZE = 40;

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

export type CalendarPressableBaseProps = PressableBaseProps & {
  borderRadius?: number;
  width?: number;
  height?: number;
  background?: 'transparent' | 'bg' | 'bgPrimary';
};

const CalendarPressable = memo(
  forwardRef<View, CalendarPressableBaseProps>(
    (
      {
        background = 'transparent',
        borderRadius = 1000,
        width = CALENDAR_DAY_SIZE,
        height = CALENDAR_DAY_SIZE,
        children,
        ...props
      },
      ref,
    ) => {
      return (
        <Pressable
          ref={ref}
          background={background}
          borderRadius={borderRadius}
          contentStyle={styles.pressable}
          height={height}
          width={width}
          {...props}
        >
          {children}
        </Pressable>
      );
    },
  ),
);

CalendarPressable.displayName = 'CalendarPressable';

export type CalendarDayProps = {
  /** Date of this CalendarDay. */
  date: Date;
  /** Callback function fired when pressing this CalendarDay. */
  onPress?: (date: Date) => void;
  /** Toggle active styles. */
  active?: boolean;
  /** Disables user interaction. */
  disabled?: boolean;
  /** Toggle highlighted styles. */
  highlighted?: boolean;
  /** Toggle today's date styles. */
  isToday?: boolean;
  /** Toggle current month styles. */
  isCurrentMonth?: boolean;
  /** Tooltip content shown when hovering or focusing a disabled Calendar Day. */
  disabledError?: string;
  /** Accessibility hint for the current day when it is not disabled. */
  todayAccessibilityHint?: string;
};

const getDayAccessibilityLabel = (date: Date, locale = 'en-US') =>
  `${date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
  })} ${date.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })}`;

const CalendarDay = memo(
  forwardRef<View, CalendarDayProps>(
    (
      {
        date,
        active,
        disabled,
        highlighted,
        isToday,
        isCurrentMonth,
        onPress,
        disabledError,
        todayAccessibilityHint,
      },
      ref,
    ) => {
      const { locale } = useLocale();
      const handlePress = useCallback(() => onPress?.(date), [date, onPress]);
      const accessibilityLabel = useMemo(
        () => getDayAccessibilityLabel(date, locale),
        [date, locale],
      );
      const accessibilityState = useMemo(
        () => ({ disabled: !!disabled, selected: !!active }),
        [disabled, active],
      );

      if (!isCurrentMonth) {
        return <Box aria-hidden={true} height={CALENDAR_DAY_SIZE} width={CALENDAR_DAY_SIZE} />;
      }

      // When disabled, Tooltip exposes label and disabled-error hint; omit label on trigger to avoid duplicate. Still expose today hint when isToday so screen reader users know which day is today.
      const dayButton = (
        <CalendarPressable
          ref={ref}
          accessibilityHint={isToday ? todayAccessibilityHint : undefined}
          accessibilityLabel={disabled ? undefined : accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={accessibilityState}
          background={disabled ? 'bg' : active ? 'bgPrimary' : 'bg'}
          borderColor={isToday ? 'bgPrimary' : undefined}
          bordered={isToday}
          disabled={disabled}
          feedback={disabled ? 'none' : 'light'}
          onPress={handlePress}
        >
          <Text
            accessible={false}
            align="center"
            color={
              disabled
                ? highlighted
                  ? 'fgPrimary'
                  : undefined
                : active
                  ? 'fgInverse'
                  : highlighted
                    ? 'fgPrimary'
                    : undefined
            }
            font="body"
          >
            {date.getDate()}
          </Text>
        </CalendarPressable>
      );

      if (disabled) {
        // Period between phrases gives screen readers a clear pause (e.g. "Today. Date unavailable").
        const tooltipAccessibilityHint = isToday
          ? `${todayAccessibilityHint}. ${disabledError}`
          : disabledError;
        return (
          <Tooltip
            triggerDisabled
            accessibilityHint={tooltipAccessibilityHint}
            accessibilityLabel={accessibilityLabel}
            content={disabledError}
          >
            {dayButton}
          </Tooltip>
        );
      }

      return dayButton;
    },
  ),
);

CalendarDay.displayName = 'CalendarDay';

export type CalendarBaseProps = {
  /** Currently selected Calendar date. Date used to generate the Calendar month. Will be rendered with active styles. */
  selectedDate?: Date | null;
  /** Date used to generate the Calendar month when there is no value for the `selectedDate` prop, defaults to today. */
  seedDate?: Date;
  /** Callback function fired when pressing a Calendar date. */
  onPressDate?: (date: Date) => void;
  /** Disables user interaction. */
  disabled?: boolean;
  /** Hides the Calendar next and previous month arrows, but does not prevent navigating to the next or previous months via keyboard. This probably only makes sense to be used when `minDate` and `maxDate` are set to the first and last days of the same month. */
  hideControls?: boolean;
  /** Array of disabled dates, and date tuples for date ranges. Make sure to set `disabledDateError` as well. A number is created for every individual date within a tuple range, so do not abuse this with massive ranges. */
  disabledDates?: (Date | [Date, Date])[];
  /** Array of highlighted dates, and date tuples for date ranges. A number is created for every individual date within a tuple range, so do not abuse this with massive ranges. */
  highlightedDates?: (Date | [Date, Date])[];
  /** Minimum date allowed to be selected, inclusive. Dates before the `minDate` are disabled. All navigation to months before the `minDate` is disabled. */
  minDate?: Date;
  /** Maximum date allowed to be selected, inclusive. Dates after the `maxDate` are disabled. All navigation to months after the `maxDate` is disabled. */
  maxDate?: Date;
  /**
   * Tooltip content shown when hovering or focusing a disabled date, including dates before the `minDate` or after the `maxDate`.
   * @default 'Date unavailable'
   */
  disabledDateError?: string;
  /**
   * Accessibility label describing the Calendar next month arrow.
   * @default 'Go to next month'
   */
  nextArrowAccessibilityLabel?: string;
  /**
   * Accessibility label describing the Calendar previous month arrow.
   * @default 'Go to previous month'
   */
  previousArrowAccessibilityLabel?: string;
  /**
   * Accessibility hint for the current day when it is not disabled. Omit or leave default for non-localized usage.
   * @default 'Today'
   */
  todayAccessibilityHint?: string;
  /** Used to locate this element in unit and end-to-end tests. */
  testID?: string;
  /** Custom style to apply to the Calendar container. */
  style?: StyleProp<ViewStyle>;
};

export type CalendarRefHandle = {
  /** Sets accessibility focus on the selected date, seed date, or today. */
  focusInitialDate: () => void;
};

export type CalendarProps = CalendarBaseProps & Omit<VStackProps, 'children' | 'ref'>;

// These could be dynamically generated, but our Calendar and DatePicker aren't localized so there's no point
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Calendar = memo(
  forwardRef<CalendarRefHandle, CalendarProps>(
    (
      {
        selectedDate,
        seedDate,
        onPressDate,
        disabled,
        hideControls,
        disabledDates,
        highlightedDates,
        minDate,
        maxDate,
        disabledDateError = 'Date unavailable',
        nextArrowAccessibilityLabel = 'Go to next month',
        previousArrowAccessibilityLabel = 'Go to previous month',
        todayAccessibilityHint = 'Today',
        testID,
        style,
        ...props
      },
      ref,
    ) => {
      const { setA11yFocus, announceForA11y } = useA11y();
      const today = useMemo(() => getMidnightDate(new Date()), []);
      const todayTime = useMemo(() => today.getTime(), [today]);

      // Determine default calendar seed date: use whichever comes first between maxDate and today
      const defaultSeedDate = useMemo<Date>(() => {
        if (selectedDate) {
          return selectedDate;
        }
        if (seedDate) {
          return seedDate;
        }
        if (maxDate) {
          const maxDateTime = getMidnightDate(maxDate).getTime();
          const todayTime = today.getTime();
          return maxDateTime < todayTime ? maxDate : today;
        }
        return today;
      }, [selectedDate, seedDate, maxDate, today]);

      const [calendarSeedDate, setCalendarSeedDate] = useState<Date>(defaultSeedDate);

      const initialFocusRef = useRef<View>(null);
      const calendarMonth = useMemo(
        () => generateCalendarMonth(calendarSeedDate),
        [calendarSeedDate],
      );

      const selectedTime = useMemo(
        () => (selectedDate ? getMidnightDate(selectedDate).getTime() : null),
        [selectedDate],
      );

      const disabledTimes = useMemo(
        () => new Set(getTimesFromDatesAndRanges(disabledDates || [])),
        [disabledDates],
      );

      const focusTargetTime = useMemo(
        () => selectedTime || (seedDate ? getMidnightDate(seedDate).getTime() : null) || todayTime,
        [selectedTime, seedDate, todayTime],
      );

      const handleDatePress = useCallback(
        (date: Date) => {
          onPressDate?.(date);

          // Note: We don't need to re-focus the button after selection.
          // The button remains focused after activation, and both TalkBack and VoiceOver
          // automatically announce the updated accessibilityState={{ selected: true }}.
        },
        [onPressDate],
      );

      useImperativeHandle(
        ref,
        () => ({
          focusInitialDate: () => {
            if (disabled || !initialFocusRef.current) {
              return;
            }
            setA11yFocus(initialFocusRef);
          },
        }),
        [disabled, setA11yFocus],
      );

      const minTime = useMemo(() => minDate && getMidnightDate(minDate).getTime(), [minDate]);

      const maxTime = useMemo(() => maxDate && getMidnightDate(maxDate).getTime(), [maxDate]);

      const highlightedTimes = useMemo(
        () => new Set(getTimesFromDatesAndRanges(highlightedDates || [])),
        [highlightedDates],
      );

      const handleGoNextMonth = useCallback(() => {
        setCalendarSeedDate((s) => {
          const next = new Date(s.getFullYear(), s.getMonth() + 1, 1);
          announceForA11y(next.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
          return next;
        });
      }, [setCalendarSeedDate, announceForA11y]);

      const handleGoPreviousMonth = useCallback(() => {
        setCalendarSeedDate((s) => {
          const prev = new Date(s.getFullYear(), s.getMonth() - 1, 1);
          announceForA11y(prev.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
          return prev;
        });
      }, [setCalendarSeedDate, announceForA11y]);

      const disableGoNextMonth = useMemo(() => {
        if (disabled) {
          return true;
        }
        const firstDateOfNextMonth = new Date(
          calendarSeedDate.getFullYear(),
          calendarSeedDate.getMonth() + 1,
          1,
        );
        return maxTime ? maxTime < firstDateOfNextMonth.getTime() : false;
      }, [maxTime, calendarSeedDate, disabled]);

      const disableGoPreviousMonth = useMemo(() => {
        if (disabled) {
          return true;
        }
        const lastDateOfPreviousMonth = new Date(
          calendarSeedDate.getFullYear(),
          calendarSeedDate.getMonth(),
          0,
        );
        return minTime ? minTime > lastDateOfPreviousMonth.getTime() : false;
      }, [minTime, calendarSeedDate, disabled]);

      // Split calendar month into weeks (rows of 7 days)
      const calendarWeeks = useMemo(() => {
        const weeks = [];
        for (let i = 0; i < calendarMonth.length; i += 7) {
          weeks.push(calendarMonth.slice(i, i + 7));
        }
        return weeks;
      }, [calendarMonth]);

      const monthYearLabel = useMemo(
        () =>
          calendarSeedDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
        [calendarSeedDate],
      );

      const previousArrowAccessibilityState = useMemo(
        () => ({ disabled: !!disableGoPreviousMonth }),
        [disableGoPreviousMonth],
      );
      const nextArrowAccessibilityState = useMemo(
        () => ({ disabled: !!disableGoNextMonth }),
        [disableGoNextMonth],
      );

      return (
        <VStack
          background="bg"
          borderRadius={400}
          opacity={disabled ? accessibleOpacityDisabled : undefined}
          overflow="hidden"
          style={style}
          testID={testID}
          {...props}
        >
          <HStack
            alignItems="center"
            justifyContent="space-between"
            paddingBottom={2}
            paddingX={1.5}
          >
            <Text accessibilityRole="header" font="headline">
              {monthYearLabel}
            </Text>
            {!hideControls && (
              <HStack gap={1} marginEnd={-1}>
                <CalendarPressable
                  accessibilityLabel={previousArrowAccessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={previousArrowAccessibilityState}
                  background="bg"
                  disabled={disableGoPreviousMonth}
                  feedback="light"
                  onPress={disableGoPreviousMonth ? undefined : handleGoPreviousMonth}
                >
                  <Icon color="fg" name="backArrow" size="s" />
                </CalendarPressable>
                <CalendarPressable
                  accessibilityLabel={nextArrowAccessibilityLabel}
                  accessibilityRole="button"
                  accessibilityState={nextArrowAccessibilityState}
                  background="bg"
                  disabled={disableGoNextMonth}
                  feedback="light"
                  onPress={disableGoNextMonth ? undefined : handleGoNextMonth}
                >
                  <Icon color="fg" name="forwardArrow" size="s" />
                </CalendarPressable>
              </HStack>
            )}
          </HStack>

          {/* Days of week header */}
          <HStack aria-hidden={true} gap={1} justifyContent="space-between" paddingBottom={1}>
            {daysOfWeek.map((day) => (
              <Box
                key={day}
                alignItems="center"
                height={CALENDAR_DAY_SIZE}
                justifyContent="center"
                width={CALENDAR_DAY_SIZE}
              >
                <Text font="body" userSelect="none">
                  {day.charAt(0)}
                </Text>
              </Box>
            ))}
          </HStack>

          {/* Calendar grid - weeks */}
          <VStack gap={1}>
            {calendarWeeks.map((week, weekIndex) => (
              <HStack key={weekIndex} gap={1} justifyContent="space-between">
                {week.map((date) => {
                  const time = date.getTime();
                  return (
                    <CalendarDay
                      key={time}
                      ref={time === focusTargetTime ? initialFocusRef : undefined}
                      active={time === selectedTime}
                      date={date}
                      disabled={
                        disabled ||
                        (minTime !== undefined && minTime !== null && time < minTime) ||
                        (maxTime !== undefined && maxTime !== null && time > maxTime) ||
                        disabledTimes.has(time)
                      }
                      disabledError={disabledDateError}
                      highlighted={highlightedTimes.has(time)}
                      isCurrentMonth={date.getMonth() === calendarSeedDate.getMonth()}
                      isToday={time === todayTime}
                      onPress={handleDatePress}
                      todayAccessibilityHint={todayAccessibilityHint}
                    />
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </VStack>
      );
    },
  ),
);

Calendar.displayName = 'Calendar';
