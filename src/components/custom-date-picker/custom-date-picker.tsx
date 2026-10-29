import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export interface CustomDatePickerProps {
  label?: string;
  value: string; // ISO date string 'YYYY-MM-DD'
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  fullWidth?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  disabled?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CustomDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'Select date',
  fullWidth = true,
  required = false,
  error = false,
  helperText,
  disabled = false,
}: CustomDatePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Parse current value or fallback to today
  const selectedDayjs = useMemo(() => {
    if (!value) return null;
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }, [value]);

  // View state for navigating months inside popover
  const [viewDate, setViewDate] = useState<Dayjs>(selectedDayjs || dayjs());

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    setViewDate(selectedDayjs || dayjs());
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isOpen = Boolean(anchorEl);

  // Month navigation
  const handlePrevMonth = () => {
    setViewDate(prev => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setViewDate(prev => prev.add(1, 'month'));
  };

  // Generate calendar days for the current viewDate
  const calendarDays = useMemo(() => {
    const startOfMonth = viewDate.startOf('month');
    const startDayOfWeek = startOfMonth.day(); // 0 = Sunday
    const daysInMonth = viewDate.daysInMonth();

    const days: Array<{
      date: Dayjs;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }> = [];

    // Days from previous month
    const prevMonth = viewDate.subtract(1, 'month');
    const prevMonthDays = prevMonth.daysInMonth();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonth.date(prevMonthDays - i);
      const isDis = (minDate && d.isBefore(dayjs(minDate), 'day')) || (maxDate && d.isAfter(dayjs(maxDate), 'day'));
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.isSame(dayjs(), 'day'),
        isSelected: Boolean(selectedDayjs && d.isSame(selectedDayjs, 'day')),
        isDisabled: Boolean(isDis),
      });
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = viewDate.date(i);
      const isDis = (minDate && d.isBefore(dayjs(minDate), 'day')) || (maxDate && d.isAfter(dayjs(maxDate), 'day'));
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.isSame(dayjs(), 'day'),
        isSelected: Boolean(selectedDayjs && d.isSame(selectedDayjs, 'day')),
        isDisabled: Boolean(isDis),
      });
    }

    // Days from next month to complete 5 or 6 weeks (multiples of 7)
    const nextMonth = viewDate.add(1, 'month');
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = nextMonth.date(i);
        const isDis = (minDate && d.isBefore(dayjs(minDate), 'day')) || (maxDate && d.isAfter(dayjs(maxDate), 'day'));
        days.push({
          date: d,
          isCurrentMonth: false,
          isToday: d.isSame(dayjs(), 'day'),
          isSelected: Boolean(selectedDayjs && d.isSame(selectedDayjs, 'day')),
          isDisabled: Boolean(isDis),
        });
      }
    }

    return days;
  }, [viewDate, selectedDayjs, minDate, maxDate]);

  const handleSelectDate = (date: Dayjs) => {
    onChange(date.format('YYYY-MM-DD'));
    handleClose();
  };

  const handleSelectToday = () => {
    const today = dayjs();
    onChange(today.format('YYYY-MM-DD'));
    handleClose();
  };

  const handleClear = () => {
    onChange('');
    handleClose();
  };

  const displayString = selectedDayjs ? selectedDayjs.format('DD MMM YYYY') : '';

  return (
    <>
      <TextField
        fullWidth={fullWidth}
        label={label}
        value={displayString}
        placeholder={placeholder}
        required={required}
        error={error}
        helperText={helperText}
        disabled={disabled}
        onClick={handleOpen}
        slotProps={{
          input: {
            readOnly: true,
            sx: {
              cursor: disabled ? 'default' : 'pointer',
              bgcolor: '#fff',
              '& input': { cursor: disabled ? 'default' : 'pointer', fontWeight: 600, fontSize: 14 },
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleOpen} disabled={disabled} sx={{ color: '#1d68d8' }}>
                  <Iconify icon="solar:calendar-mark-bold" width={20} />
                </IconButton>
              </InputAdornment>
            ),
          },
          inputLabel: {
            shrink: Boolean(displayString) || isOpen,
          },
        }}
      />

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              mt: 1,
              width: 320,
              borderRadius: 3,
              boxShadow: '0 16px 40px rgba(15, 23, 42, 0.16)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            },
          },
        }}
      >
        {/* Month Header Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <IconButton size="small" onClick={handlePrevMonth} sx={{ color: '#475569' }}>
            <Iconify icon="solar:alt-arrow-left-linear" width={18} />
          </IconButton>

          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>
            {viewDate.format('MMMM YYYY')}
          </Typography>

          <IconButton size="small" onClick={handleNextMonth} sx={{ color: '#475569' }}>
            <Iconify icon="solar:alt-arrow-right-linear" width={18} />
          </IconButton>
        </Box>

        {/* Weekday Labels */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1, textAlign: 'center' }}>
          {WEEKDAYS.map((day, idx) => (
            <Typography
              key={day}
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: 11.5,
                color: idx === 0 || idx === 6 ? '#ef4444' : '#64748b',
                textTransform: 'uppercase',
              }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        {/* Days Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {calendarDays.map((item, idx) => {
            const isDimmed = !item.isCurrentMonth;
            return (
              <ButtonBase
                key={idx}
                disabled={item.isDisabled}
                onClick={() => handleSelectDate(item.date)}
                sx={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: item.isSelected ? 800 : item.isToday ? 700 : 500,
                  color: item.isSelected
                    ? '#fff'
                    : isDimmed
                      ? '#cbd5e1'
                      : item.isDisabled
                        ? '#cbd5e1'
                        : '#1e293b',
                  bgcolor: item.isSelected
                    ? '#1d68d8'
                    : item.isToday
                      ? '#eff6ff'
                      : 'transparent',
                  border: item.isToday && !item.isSelected ? '1px solid #bfdbfe' : 'none',
                  boxShadow: item.isSelected ? '0 4px 10px rgba(29, 104, 216, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: item.isSelected ? '#1552b0' : '#f1f5f9',
                  },
                }}
              >
                {item.date.date()}
              </ButtonBase>
            );
          })}
        </Box>

        {/* Bottom Actions: Clear & Today */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1.5,
            mt: 1.5,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <Button
            size="small"
            onClick={handleClear}
            color="inherit"
            sx={{ fontSize: 12, textTransform: 'none', color: '#64748b' }}
          >
            Clear
          </Button>
          <Button
            size="small"
            onClick={handleSelectToday}
            variant="text"
            sx={{ fontSize: 12, fontWeight: 700, textTransform: 'none', color: '#1d68d8' }}
          >
            Today
          </Button>
        </Box>
      </Popover>
    </>
  );
}
